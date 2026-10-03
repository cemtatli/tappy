import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  openDb,
  getAllTweets,
  putTweets,
  deleteTweetById,
  getMeta,
  setMeta,
  listCollections,
  putCollection,
  deleteCollection,
  addImagesToCollection,
  removeImagesFromCollection,
  ensureFavoritesCollection,
  FAVORITES_ID,
} from '../shared/db.js';
import { parseBookmarksResponse } from '../shared/tweetModel.js';
import { applyFilters, EMPTY_FILTERS } from '../shared/filters.js';
import { sortTweets } from '../shared/sort.js';
import { toJson, toCsv } from '../shared/exporters.js';
import {
  createSelectionState,
  toggleSelection,
  clearSelection,
} from './selection.js';
import {
  requestBookmarksPage,
  requestDeleteBookmark,
} from '../shared/messages.js';
import { loadPrefs, savePrefs } from './prefs.js';
import {
  flattenImages,
  imageKeyFor,
  imagesForCollection,
  parseImageKey,
} from '../shared/images.js';
import { CardGrid } from './components/CardGrid.jsx';
import { SelectionBar } from './components/SelectionBar.jsx';
import { ToastStack } from './components/ToastStack.jsx';
import { addToast, removeToast } from './lib/toasts.js';
import {
  PreviewPanel,
  PREVIEW_PANEL_WIDTH,
} from './components/PreviewPanel.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { ImageCanvas } from './components/canvas/ImageCanvas.jsx';
import { ImageLightbox } from './components/canvas/ImageLightbox.jsx';
import { CanvasToolbar } from './components/CanvasToolbar.jsx';
import { AddToCollectionMenu } from './components/AddToCollectionMenu.jsx';
import { exportToFigma } from './lib/figmaExport.js';
import { buildZip } from './lib/zip.js';
import { nextViewFromKey } from './lib/shortcuts.js';
import { DEFAULT_COLLECTION_COLOR } from './lib/collectionColors.js';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from './components/ui/AlertDialog.jsx';

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(filename, blob);
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Must match the card-exit keyframe duration (--dur-base) in app.css.
const CARD_EXIT_MS = 200;

export function App() {
  const dbRef = useRef(null);
  const isLoadingOlderRef = useRef(false);
  const toastIdRef = useRef(0);
  // Unmark sırasında X'ten yeni sayfa gelirse aynı tweet geri yazılır (zombi).
  // Bekleyen id'leri sync/refresh yollarından dışla.
  const pendingUnmarkRef = useRef(new Set());
  const [unmarkConfirm, setUnmarkConfirm] = useState(null);

  const [allTweets, setAllTweets] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(createSelectionState());
  const [toasts, setToasts] = useState([]);
  const [bulkProgress, setBulkProgress] = useState(null);
  const [exitingIds, setExitingIds] = useState(() => new Set());
  const [prefs] = useState(loadPrefs);
  const [sortMode, setSortMode] = useState(prefs.sortMode);
  const [previewId, setPreviewId] = useState(null);
  const [viewMode, setViewMode] = useState(prefs.viewMode);
  const [source, setSource] = useState(prefs.source);
  const [collections, setCollections] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [selectedImageKeys, setSelectedImageKeys] = useState(new Set());
  const [addTarget, setAddTarget] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  // find() returns undefined once the tweet is deleted, closing the panel.
  const previewTweet = previewId
    ? (allTweets.find((t) => t.id === previewId) ?? null)
    : null;

  const sourceTweets = useMemo(() => {
    if (typeof source === 'object' && source) {
      const c = collections.find((x) => x.id === source.collectionId);
      if (!c) return [];
      const tweetIds = new Set(
        c.imageKeys.map((k) => parseImageKey(k).tweetId)
      );
      return allTweets.filter((t) => tweetIds.has(t.id));
    }
    if (source === 'images') {
      return allTweets.filter((t) => (t.mediaUrls?.length ?? 0) > 0);
    }
    return allTweets;
  }, [allTweets, source, collections]);

  const filteredTweets = useMemo(
    () => sortTweets(applyFilters(sourceTweets, filters), sortMode),
    [sourceTweets, filters, sortMode]
  );

  const canvasImages = useMemo(() => {
    if (typeof source === 'object') {
      const c = collections.find((x) => x.id === source.collectionId);
      if (!c) return [];
      const byId = new Map(filteredTweets.map((t) => [t.id, t]));
      return imagesForCollection(c, byId);
    }
    return flattenImages(filteredTweets);
  }, [source, collections, filteredTweets]);

  useEffect(() => {
    savePrefs({ sortMode });
  }, [sortMode]);

  useEffect(() => {
    savePrefs({ viewMode });
  }, [viewMode]);

  useEffect(() => {
    savePrefs({ source });
  }, [source]);

  useEffect(() => {
    function onKey(e) {
      const t = e.target;
      const typing =
        !!t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable);
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey;
      const next = nextViewFromKey(e.key, { typing, hasModifier });
      if (next) setViewMode(next);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => removeToast(current, id));
  }, []);

  const pushToast = useCallback(
    (type, message) => {
      toastIdRef.current += 1;
      const id = toastIdRef.current;
      setToasts((current) => addToast(current, { id, type, message }));
      setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  // Back-compat: existing error call sites become red toasts.
  const showStatus = useCallback(
    (message) => pushToast('error', message),
    [pushToast]
  );

  function withoutPendingUnmark(tweets) {
    const pending = pendingUnmarkRef.current;
    return pending.size === 0
      ? tweets
      : tweets.filter((t) => !pending.has(t.id));
  }

  async function refreshFromDb() {
    setAllTweets(withoutPendingUnmark(await getAllTweets(dbRef.current)));
  }

  async function refreshCollections() {
    if (!dbRef.current) return;
    setCollections(await listCollections(dbRef.current));
  }

  const favoritesCollection = useMemo(
    () => collections.find((c) => c.id === FAVORITES_ID) ?? null,
    [collections]
  );

  const userCollections = useMemo(
    () => collections.filter((c) => c.id !== FAVORITES_ID),
    [collections]
  );

  const favoriteKeys = useMemo(
    () => new Set(favoritesCollection?.imageKeys ?? []),
    [favoritesCollection]
  );

  const counts = useMemo(() => {
    const images = allTweets.filter(
      (t) => (t.mediaUrls?.length ?? 0) > 0
    ).length;
    const byCollection = new Map(
      userCollections.map((c) => [c.id, c.imageKeys.length])
    );
    return {
      all: allTweets.length,
      images,
      byCollection,
      favorites: favoritesCollection?.imageKeys.length ?? 0,
    };
  }, [allTweets, userCollections, favoritesCollection]);

  const addMemberOf = useMemo(() => {
    if (!addTarget) return new Set();
    // a collection is "checked" only if it contains ALL target keys
    const set = new Set();
    for (const c of userCollections) {
      if (addTarget.every((k) => c.imageKeys.includes(k))) set.add(c.id);
    }
    return set;
  }, [addTarget, userCollections]);

  async function handleCreateCollection(name, color) {
    const order = collections.length;
    await putCollection(dbRef.current, {
      id: crypto.randomUUID(),
      name,
      order,
      createdAt: new Date().toISOString(),
      imageKeys: [],
      color: color ?? DEFAULT_COLLECTION_COLOR,
    });
    await refreshCollections();
  }

  async function handleSetCollectionColor(id, color) {
    const c = collections.find((x) => x.id === id);
    if (!c) return;
    await putCollection(dbRef.current, { ...c, color });
    await refreshCollections();
  }

  async function handleRenameCollection(id, name) {
    const c = collections.find((x) => x.id === id);
    if (!c) return;
    await putCollection(dbRef.current, { ...c, name });
    await refreshCollections();
  }

  async function handleDeleteCollection(id) {
    await deleteCollection(dbRef.current, id);
    if (typeof source === 'object' && source.collectionId === id)
      setSource('all');
    await refreshCollections();
  }

  async function syncNewest(newestCached) {
    let cursor;
    let keepGoing = true;

    while (keepGoing) {
      const result = await requestBookmarksPage(cursor);
      if (!result.ok) {
        if (result.error.code === 'NOT_LOGGED_IN') {
          showStatus("X.com'da giriş yapılı bir sekmede bu eklentiyi kullan.");
        } else {
          showStatus(`Senkron hatası: ${result.error.message}`);
        }
        return;
      }

      const { tweets, nextCursor } = parseBookmarksResponse(
        result.data,
        new Date().toISOString()
      );
      const newOnes = withoutPendingUnmark(
        newestCached
          ? tweets.filter(
              (t) => BigInt(t.sortIndex) > BigInt(newestCached.sortIndex)
            )
          : tweets
      );

      if (newOnes.length > 0) {
        await putTweets(dbRef.current, newOnes);
        await refreshFromDb();
      }

      keepGoing =
        newOnes.length === tweets.length &&
        tweets.length > 0 &&
        Boolean(nextCursor);
      cursor = nextCursor;
    }
  }

  async function loadOlderPage() {
    if (isLoadingOlderRef.current) return;
    isLoadingOlderRef.current = true;
    try {
      const cursor = await getMeta(dbRef.current, 'olderCursor');
      const result = await requestBookmarksPage(cursor ?? undefined);
      if (!result.ok) {
        showStatus(`Eski kayıtlar çekilemedi: ${result.error.message}`);
        return;
      }
      const { tweets: fetched, nextCursor } = parseBookmarksResponse(
        result.data,
        new Date().toISOString()
      );
      const tweets = withoutPendingUnmark(fetched);
      if (tweets.length > 0) {
        await putTweets(dbRef.current, tweets);
        await refreshFromDb();
      }
      await setMeta(dbRef.current, 'olderCursor', nextCursor);
    } finally {
      isLoadingOlderRef.current = false;
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await openDb();
      if (cancelled) return;
      dbRef.current = db;
      await ensureFavoritesCollection(db);
      const cached = await getAllTweets(db);
      if (cancelled) return;
      setAllTweets(cached);
      await refreshCollections();
      syncNewest(cached[0]);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterChange(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleToggleSelect(id) {
    setSelectedIds((current) => toggleSelection(current, id));
  }

  function handlePreview(id) {
    setPreviewId((current) => (current === id ? null : id));
  }

  function handleExportOne(id) {
    const tweet = allTweets.find((t) => t.id === id);
    if (!tweet) return;
    downloadFile(`bookmark-${id}.json`, toJson([tweet]), 'application/json');
  }

  // Hold the rows in place while their exit plays, then drop them so the list
  // closes up once — instead of the card vanishing mid-frame.
  function playExit(ids) {
    setExitingIds((current) => new Set([...current, ...ids]));
    return new Promise((resolve) =>
      setTimeout(() => {
        setExitingIds((current) => {
          const next = new Set(current);
          for (const id of ids) next.delete(id);
          return next;
        });
        resolve();
      }, CARD_EXIT_MS)
    );
  }

  // X'teki silme geri alınamaz; tek tık yerine onay iste.
  function handleUnmarkOne(id) {
    if (!allTweets.some((t) => t.id === id)) return;
    setUnmarkConfirm({ ids: [id] });
  }

  // Önce X'te sil, başarılıysa yerel kaydı kaldır. Optimistic yerel silme
  // hata durumunda kayıp, sync ile çakışınca zombi kayıt üretiyordu.
  async function runUnmark(ids) {
    const removedById = new Map(
      allTweets.filter((t) => ids.includes(t.id)).map((t) => [t.id, t])
    );
    const targets = Array.from(removedById.keys());
    if (targets.length === 0) return;
    const bulk = targets.length > 1;
    for (const id of targets) pendingUnmarkRef.current.add(id);
    try {
      await playExit(targets);
      setAllTweets((current) => current.filter((t) => !removedById.has(t.id)));
      setSelectedIds(clearSelection());
      const failed = [];
      let lastError = null;
      for (let i = 0; i < targets.length; i += 1) {
        if (bulk)
          setBulkProgress(`${i + 1}/${targets.length} unmark ediliyor...`);
        const id = targets[i];
        const result = await requestDeleteBookmark(id);
        if (result.ok) {
          await deleteTweetById(dbRef.current, id);
        } else {
          failed.push(removedById.get(id));
          lastError = result.error;
        }
      }
      if (failed.length > 0) {
        setAllTweets((current) => [
          ...current,
          ...failed.filter((t) => !current.some((c) => c.id === t.id)),
        ]);
        showStatus(
          bulk
            ? `${failed.length} kayıt unmark edilemedi, geri alındı.`
            : `Unmark başarısız, geri alındı: ${lastError?.message ?? ''}`
        );
      }
      const ok = targets.length - failed.length;
      if (ok > 0) {
        pushToast(
          'success',
          bulk ? `${ok} bookmark kaldırıldı` : 'Bookmark kaldırıldı'
        );
      }
    } finally {
      for (const id of targets) pendingUnmarkRef.current.delete(id);
      if (bulk) setBulkProgress(null);
    }
  }

  function handleToggleSelectionMode() {
    setSelectionMode((current) => {
      const next = !current;
      if (!next) {
        setSelectedIds(clearSelection());
        setSelectedImageKeys(new Set());
      }
      return next;
    });
  }

  function handleExportAll() {
    downloadFile('bookmarks.json', toJson(filteredTweets), 'application/json');
  }

  function handleBulkExportJson() {
    const selected = allTweets.filter((t) => selectedIds.has(t.id));
    downloadFile(
      'bookmarks-selected.json',
      toJson(selected),
      'application/json'
    );
  }

  function handleBulkExportCsv() {
    const selected = allTweets.filter((t) => selectedIds.has(t.id));
    downloadFile('bookmarks-selected.csv', toCsv(selected), 'text/csv');
  }

  function handleBulkUnmark() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setUnmarkConfirm({ ids });
  }

  const handleToggleImageSelect = useCallback((imageKey) => {
    setSelectedImageKeys((prev) => {
      const next = new Set(prev);
      if (next.has(imageKey)) {
        next.delete(imageKey);
      } else {
        next.add(imageKey);
      }
      return next;
    });
  }, []);

  const handleImagePreview = useCallback((image) => {
    const { tweetId } = parseImageKey(image.imageKey);
    setPreviewId((current) => (current === tweetId ? null : tweetId));
  }, []);

  const handleOpenAddToCollection = useCallback((image) => {
    setAddTarget([image.imageKey]);
  }, []);

  const handleToggleFavorite = useCallback(
    async (image) => {
      const key = image.imageKey;
      const wasFavorite = favoriteKeys.has(key);
      if (wasFavorite) {
        await removeImagesFromCollection(dbRef.current, FAVORITES_ID, [key]);
      } else {
        await addImagesToCollection(dbRef.current, FAVORITES_ID, [key]);
      }
      await refreshCollections();
      pushToast(
        'success',
        wasFavorite ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi'
      );
    },
    [favoriteKeys, pushToast]
  );

  const handleOpenLightbox = useCallback((image, originRect) => {
    setLightbox({ image, originRect });
  }, []);

  function handleBulkAddToCollection() {
    let keys;
    if (viewMode === 'canvas') {
      keys = Array.from(selectedImageKeys);
    } else {
      const byId = new Map(allTweets.map((t) => [t.id, t]));
      keys = [];
      for (const id of selectedIds) {
        const t = byId.get(id);
        if (!t) continue;
        (t.mediaUrls ?? []).forEach((_, i) => keys.push(imageKeyFor(t.id, i)));
      }
    }
    if (keys.length === 0) {
      showStatus('Seçili tweetlerde görsel yok.');
      return;
    }
    setAddTarget(keys);
  }

  async function handleFigmaExport() {
    const keys = Array.from(selectedImageKeys);
    const byId = new Map(allTweets.map((t) => [t.id, t]));
    const images = keys
      .map((k) => {
        const { tweetId, mediaIndex } = parseImageKey(k);
        const t = byId.get(tweetId);
        if (!t || t.mediaUrls[mediaIndex] == null) return null;
        return {
          imageKey: k,
          tweetId,
          mediaIndex,
          url: t.mediaUrls[mediaIndex],
          authorHandle: t.authorHandle,
        };
      })
      .filter(Boolean);
    if (images.length === 0) return;
    try {
      const r = await exportToFigma(images, { buildZip, downloadBlob });
      showStatus(
        r.path === 'zip'
          ? `${r.count} görsel ZIP olarak indi — Figma'ya sürükle.`
          : `${r.count} görsel Figma'ya aktarıldı.`
      );
    } catch (e) {
      showStatus(`Figma aktarımı başarısız: ${e.message}`);
    }
  }

  async function handleToggleMembership(collectionId, nextChecked) {
    if (!addTarget) return;
    if (nextChecked) {
      await addImagesToCollection(dbRef.current, collectionId, addTarget);
    } else {
      await removeImagesFromCollection(dbRef.current, collectionId, addTarget);
    }
    await refreshCollections();
  }

  const lightboxImages = useMemo(
    () =>
      lightbox
        ? flattenImages(
            allTweets.filter((t) => t.id === lightbox.image.tweetId)
          )
        : [],
    [lightbox, allTweets]
  );

  return (
    <div className="flex h-screen">
      <Sidebar
        source={source}
        onSourceChange={setSource}
        collections={userCollections}
        counts={counts}
        search={filters.search}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={() => setFilters({ ...EMPTY_FILTERS })}
        resultCount={
          viewMode === 'canvas' ? canvasImages.length : filteredTweets.length
        }
        resultLabel={viewMode === 'canvas' ? 'görsel' : 'bookmark'}
        onSearchChange={(v) => handleFilterChange('search', v)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortMode={sortMode}
        onSortChange={setSortMode}
        onCreateCollection={handleCreateCollection}
        onRenameCollection={handleRenameCollection}
        onDeleteCollection={handleDeleteCollection}
        onSetCollectionColor={handleSetCollectionColor}
        onOpenSettings={() => setSettingsOpen(true)}
        selectionMode={selectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        onExportAll={handleExportAll}
      />
      <div className="flex flex-1 justify-center">
        <div className="flex min-h-0 flex-1">
          {viewMode === 'canvas' ? (
            <>
              <ImageCanvas
                images={canvasImages}
                zoom={zoom}
                onZoomChange={setZoom}
                selectionMode={selectionMode}
                selectedIds={selectedImageKeys}
                onToggleSelect={handleToggleImageSelect}
                onOpenLightbox={handleOpenLightbox}
              />
              <PreviewPanel
                tweet={previewTweet}
                onClose={() => setPreviewId(null)}
                overlay
              />
              <CanvasToolbar zoom={zoom} onZoomChange={setZoom} />
            </>
          ) : (
            <>
              <CardGrid
                tweets={filteredTweets}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                exitingIds={exitingIds}
                onToggleSelect={handleToggleSelect}
                onExportOne={handleExportOne}
                onUnmarkOne={handleUnmarkOne}
                onPreview={handlePreview}
                onStatus={showStatus}
                onLoadMore={loadOlderPage}
              />
              <PreviewPanel
                tweet={previewTweet}
                onClose={() => setPreviewId(null)}
              />
              <CanvasToolbar zoom={1} onZoomChange={null} />
            </>
          )}
        </div>
      </div>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <SelectionBar
        visible={
          selectionMode &&
          (viewMode === 'canvas'
            ? selectedImageKeys.size > 0
            : selectedIds.size > 0)
        }
        count={
          viewMode === 'canvas' ? selectedImageKeys.size : selectedIds.size
        }
        statusText={bulkProgress}
        onBulkAddToCollection={handleBulkAddToCollection}
        onBulkFigmaExport={
          viewMode === 'canvas' ? handleFigmaExport : undefined
        }
        onBulkExportJson={
          viewMode === 'canvas' ? undefined : handleBulkExportJson
        }
        onBulkExportCsv={
          viewMode === 'canvas' ? undefined : handleBulkExportCsv
        }
        onBulkUnmark={viewMode === 'canvas' ? undefined : handleBulkUnmark}
        onClear={
          viewMode === 'canvas'
            ? () => setSelectedImageKeys(new Set())
            : () => setSelectedIds(clearSelection())
        }
      />
      <AddToCollectionMenu
        open={Boolean(addTarget)}
        collections={userCollections}
        memberOf={addMemberOf}
        onToggle={handleToggleMembership}
        onClose={() => setAddTarget(null)}
      />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <AlertDialog
        open={Boolean(unmarkConfirm)}
        onOpenChange={(open) => {
          if (!open) setUnmarkConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {unmarkConfirm?.ids.length > 1
              ? `${unmarkConfirm.ids.length} bookmark kaldırılsın mı?`
              : 'Bookmark kaldırılsın mı?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            X&apos;teki bookmark listenden de silinir. Bu işlem geri alınamaz.
          </AlertDialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogClose>Vazgeç</AlertDialogClose>
            <AlertDialogClose
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => {
                const ids = unmarkConfirm?.ids ?? [];
                setUnmarkConfirm(null);
                runUnmark(ids);
              }}
            >
              Kaldır
            </AlertDialogClose>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <ImageLightbox
        images={lightboxImages}
        initialKey={lightbox?.image.imageKey ?? null}
        originRect={lightbox?.originRect ?? null}
        favoriteKeys={favoriteKeys}
        onToggleFavorite={handleToggleFavorite}
        onAddToCollection={handleOpenAddToCollection}
        onPreview={handleImagePreview}
        onUnmark={(tweetId) => {
          handleUnmarkOne(tweetId);
          setLightbox(null);
        }}
        onClose={() => setLightbox(null)}
        reservedRight={
          viewMode === 'canvas' && previewTweet ? PREVIEW_PANEL_WIDTH : 0
        }
      />
    </div>
  );
}
