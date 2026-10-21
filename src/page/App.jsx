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
  requestBookmarksPage,
  requestDeleteBookmark,
} from '../shared/messages.js';
import { loadPrefs, savePrefs } from './prefs.js';
import {
  flattenImages,
  imagesForCollection,
  parseImageKey,
} from '../shared/images.js';
import { SelectionBar } from './components/SelectionBar.jsx';
import { ToastStack } from './components/ToastStack.jsx';
import { addToast, removeToast } from './lib/toasts.js';
import {
  PreviewPanel,
  PREVIEW_PANEL_WIDTH,
} from './components/PreviewPanel.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { ImageCanvas } from './components/canvas/ImageCanvas.jsx';
import { ImageLightbox } from './components/canvas/ImageLightbox.jsx';
import { CanvasToolbar } from './components/CanvasToolbar.jsx';
import { CanvasHeader } from './components/CanvasHeader.jsx';
import { CanvasDock } from './components/CanvasDock.jsx';
import { AddToCollectionMenu } from './components/AddToCollectionMenu.jsx';
import { exportToFigma } from './lib/figmaExport.js';
import { buildZip } from './lib/zip.js';
import { clampZoom } from './lib/canvasZoom.js';
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

export function App() {
  const dbRef = useRef(null);
  const isLoadingOlderRef = useRef(false);
  const toastIdRef = useRef(0);
  // Unmark sırasında X'ten yeni sayfa gelirse aynı tweet geri yazılır (zombi).
  // Bekleyen id'leri sync/refresh yollarından dışla.
  const pendingUnmarkRef = useRef(new Set());
  const searchInputRef = useRef(null);
  const focusNonceRef = useRef(0);
  const lastSurpriseKeyRef = useRef(null);
  const [unmarkConfirm, setUnmarkConfirm] = useState(null);

  const [allTweets, setAllTweets] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImageKeys, setSelectedImageKeys] = useState(new Set());
  const [toasts, setToasts] = useState([]);
  const [bulkProgress, setBulkProgress] = useState(null);
  const [prefs] = useState(loadPrefs);
  const [sortMode, setSortMode] = useState(prefs.sortMode);
  const [previewId, setPreviewId] = useState(null);
  const [source, setSource] = useState(prefs.source);
  const [collections, setCollections] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [addTarget, setAddTarget] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

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
    // Show one frame per post first, then the carousel extras: a wall of
    // distinct posts reads better than the same caption twice in a row.
    return flattenImages(filteredTweets)
      .slice()
      .sort((a, b) => a.mediaIndex - b.mediaIndex);
  }, [source, collections, filteredTweets]);

  const advancedFilterCount = useMemo(
    () =>
      Object.keys(EMPTY_FILTERS).filter(
        (key) =>
          key !== 'search' &&
          filters[key] != null &&
          filters[key] !== EMPTY_FILTERS[key]
      ).length,
    [filters]
  );
  const filterBadge = advancedFilterCount + (source === 'all' ? 0 : 1);

  const sourceLabel = useMemo(() => {
    if (typeof source === 'object') {
      return (
        collections.find((c) => c.id === source.collectionId)?.name ??
        'Koleksiyon'
      );
    }
    if (source === 'images') return 'Görseller';
    return 'Tümü';
  }, [source, collections]);

  const viewKey = useMemo(
    () => JSON.stringify({ source, filters, sortMode }),
    [source, filters, sortMode]
  );

  useEffect(() => {
    savePrefs({ sortMode });
  }, [sortMode]);

  useEffect(() => {
    savePrefs({ source });
  }, [source]);

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

  const handleSurprise = useCallback(() => {
    if (canvasImages.length === 0) return;
    const pool =
      canvasImages.length > 1
        ? canvasImages.filter(
            (image) => image.imageKey !== lastSurpriseKeyRef.current
          )
        : canvasImages;
    const pick =
      pool[Math.floor(Math.random() * pool.length)] ?? canvasImages[0];
    lastSurpriseKeyRef.current = pick.imageKey;
    focusNonceRef.current += 1;
    setFocusRequest({
      type: 'focus',
      imageKey: pick.imageKey,
      nonce: focusNonceRef.current,
    });
  }, [canvasImages]);

  const handleRecenter = useCallback(() => {
    focusNonceRef.current += 1;
    setFocusRequest({ type: 'home', nonce: focusNonceRef.current });
  }, []);

  useEffect(() => {
    function onKey(e) {
      const target = e.target;
      const typing =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey;

      if (
        (e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        e.key.toLowerCase() === 'k'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select?.();
        return;
      }
      if (typing || hasModifier) return;
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSurprise();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSurprise]);

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
    setLoadingOlder(true);
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
      setLoadingOlder(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await openDb();
        if (cancelled) return;
        dbRef.current = db;
        await ensureFavoritesCollection(db);
        const cached = await getAllTweets(db);
        if (cancelled) return;
        setAllTweets(cached);
        await refreshCollections();
        syncNewest(cached[0]);
      } catch (error) {
        if (!cancelled) {
          showStatus(`Yerel veritabanı açılamadı: ${error.message}`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterChange(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleToggleSelectionMode() {
    setSelectionMode((current) => !current);
    setSelectedImageKeys(new Set());
  }

  function handleExportAll() {
    downloadFile('bookmarks.json', toJson(filteredTweets), 'application/json');
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
    const keys = Array.from(selectedImageKeys);
    if (keys.length === 0) {
      showStatus('Seçili görsel yok.');
      return;
    }
    setAddTarget(keys);
  }

  function handleBulkExportJson() {
    if (selectedTweets.length === 0) return;
    downloadFile(
      'bookmarks-selected.json',
      toJson(selectedTweets),
      'application/json'
    );
  }

  function handleBulkExportCsv() {
    if (selectedTweets.length === 0) return;
    downloadFile('bookmarks-selected.csv', toCsv(selectedTweets), 'text/csv');
  }

  function handleBulkUnmark() {
    const ids = selectedTweets.map((t) => t.id);
    if (ids.length === 0) return;
    setUnmarkConfirm({ ids });
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
      setAllTweets((current) => current.filter((t) => !removedById.has(t.id)));
      setSelectedImageKeys(new Set());
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

  // Selected images belong to tweets; bulk exports and unmark operate on the
  // distinct parent tweets so a multi-image selection is not duplicated.
  const selectedTweets = useMemo(() => {
    const ids = new Set(
      Array.from(selectedImageKeys, (key) => parseImageKey(key).tweetId)
    );
    return allTweets.filter((t) => ids.has(t.id));
  }, [selectedImageKeys, allTweets]);

  const hasActiveFilters =
    advancedFilterCount > 0 ||
    Boolean(filters.search?.trim()) ||
    source !== 'all';
  const emptyCopy =
    allTweets.length === 0
      ? 'Bookmark’ların yükleniyor…'
      : hasActiveFilters
        ? 'Bu filtreyle eşleşen görsel yok.'
        : 'Görsel içeren bookmark bulunamadı.';

  return (
    <div className="relative h-screen overflow-hidden bg-surface-2">
      <ImageCanvas
        images={canvasImages}
        zoom={zoom}
        onZoomChange={(next) => setZoom(clampZoom(next))}
        selectionMode={selectionMode}
        selectedIds={selectedImageKeys}
        onToggleSelect={handleToggleImageSelect}
        onOpenLightbox={handleOpenLightbox}
        focusRequest={focusRequest}
        viewKey={viewKey}
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-surface-2/90 via-surface-2/50 to-transparent" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-surface-2 via-surface-2/80 to-transparent" />

      <CanvasHeader
        count={canvasImages.length}
        sourceLabel={sourceLabel}
        selectionMode={selectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        onExportAll={handleExportAll}
        onOpenSettings={() => setSettingsOpen(true)}
        onHome={handleRecenter}
      />

      {canvasImages.length === 0 && (
        <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted">
              Sonsuz tuval
            </p>
            <h1 className="font-serif text-[34px] italic leading-[1.1] tracking-[-0.02em] text-text">
              Küçük bir keşif alanı.
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              {emptyCopy}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilters({ ...EMPTY_FILTERS });
                  setSource('all');
                }}
                className="pointer-events-auto mt-5 rounded-full border border-line bg-white px-4 py-2 text-[12px] font-medium text-text transition-colors hover:bg-black/[0.03]"
              >
                Filtreleri temizle
              </button>
            )}
          </div>
        </div>
      )}

      <CanvasDock
        search={filters.search}
        onSearchChange={(value) => handleFilterChange('search', value)}
        searchInputRef={searchInputRef}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={() => setFilters({ ...EMPTY_FILTERS })}
        activeFilterCount={filterBadge}
        resultCount={canvasImages.length}
        source={source}
        onSourceChange={setSource}
        collections={userCollections}
        counts={counts}
        onCreateCollection={handleCreateCollection}
        onRenameCollection={handleRenameCollection}
        onDeleteCollection={handleDeleteCollection}
        onSetCollectionColor={handleSetCollectionColor}
        sortMode={sortMode}
        onSortChange={setSortMode}
        onSurprise={handleSurprise}
        surpriseDisabled={canvasImages.length === 0}
        onLoadOlder={loadOlderPage}
        loadingOlder={loadingOlder}
      />

      <CanvasToolbar
        zoom={zoom}
        onZoomChange={(next) => setZoom(clampZoom(next))}
        onRecenter={handleRecenter}
      />

      <PreviewPanel
        tweet={previewTweet}
        onClose={() => setPreviewId(null)}
        overlay
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <SelectionBar
        visible={selectionMode && selectedImageKeys.size > 0}
        count={selectedImageKeys.size}
        statusText={bulkProgress}
        onBulkAddToCollection={handleBulkAddToCollection}
        onBulkFigmaExport={handleFigmaExport}
        onBulkExportJson={handleBulkExportJson}
        onBulkExportCsv={handleBulkExportCsv}
        onBulkUnmark={handleBulkUnmark}
        onClear={() => setSelectedImageKeys(new Set())}
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
        reservedRight={previewTweet ? PREVIEW_PANEL_WIDTH : 0}
      />
    </div>
  );
}
