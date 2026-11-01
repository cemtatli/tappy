import {
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { ImageCanvas } from './components/canvas/ImageCanvas.jsx';
import { ImageGrid } from './components/canvas/ImageGrid.jsx';
import { ImageLightbox } from './components/canvas/ImageLightbox.jsx';
import { CanvasToolbar } from './components/CanvasToolbar.jsx';
import { CanvasHeader } from './components/CanvasHeader.jsx';
import { CanvasDock, loadFilterPanel } from './components/CanvasDock.jsx';
import { AddToCollectionMenu } from './components/AddToCollectionMenu.jsx';
import { exportToFigma } from './lib/figmaExport.js';
import { buildZip } from './lib/zip.js';
import { clampZoom } from './lib/canvasZoom.js';
import { nextViewFromKey } from './lib/shortcuts.js';
import { DEFAULT_COLLECTION_COLOR } from './lib/collectionColors.js';
import { Button } from './components/ui/Button.jsx';

const loadSettingsPanel = () => import('./components/SettingsPanel.jsx');
const SettingsPanel = lazy(() =>
  loadSettingsPanel().then((module) => ({ default: module.SettingsPanel }))
);

// Fetched once the app is idle, so the first click on these never waits.
function preloadOptionalChunks() {
  loadSettingsPanel();
  loadFilterPanel();
  import('./components/ui/Checkbox.jsx');
}

const UNMARK_UNDO_MS = 5000;

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
  // A sync page arriving during an unmark would write the same tweet back, so
  // pending ids are kept out of the sync and refresh paths.
  const pendingUnmarkRef = useRef(new Set());
  const searchInputRef = useRef(null);
  const focusNonceRef = useRef(0);
  const lastSurpriseKeyRef = useRef(null);

  const [dbReady, setDbReady] = useState(false);
  const [allTweets, setAllTweets] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImageKeys, setSelectedImageKeys] = useState(new Set());
  const [toasts, setToasts] = useState([]);
  const [bulkProgress, setBulkProgress] = useState(null);
  const [prefs] = useState(loadPrefs);
  const [sortMode, setSortMode] = useState(prefs.sortMode);
  const [view, setView] = useState(prefs.view);
  const [previewId, setPreviewId] = useState(null);
  // 'images' was a source of its own, but every view only ever shows images.
  const [source, setSource] = useState(
    prefs.source === 'images' ? 'all' : prefs.source
  );
  const [collections, setCollections] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [addTarget, setAddTarget] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMounted, setSettingsMounted] = useState(false);
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
    return allTweets;
  }, [allTweets, source, collections]);

  // Typing stays responsive: React renders the keystroke first and refilters
  // and re-lays out the canvas in a lower-priority pass.
  const deferredFilters = useDeferredValue(filters);
  const filteredTweets = useMemo(
    () => sortTweets(applyFilters(sourceTweets, deferredFilters), sortMode),
    [sourceTweets, deferredFilters, sortMode]
  );

  const canvasImages = useMemo(() => {
    if (typeof source === 'object') {
      const c = collections.find((x) => x.id === source.collectionId);
      if (!c) return [];
      if (view === 'grid') {
        const keys = new Set(c.imageKeys);
        return flattenImages(filteredTweets).filter((image) =>
          keys.has(image.imageKey)
        );
      }
      const byId = new Map(filteredTweets.map((t) => [t.id, t]));
      return imagesForCollection(c, byId);
    }
    const images = flattenImages(filteredTweets);
    // The grid is a chronological list, so a post's frames stay together.
    if (view === 'grid') return images;
    // Show one frame per post first, then the carousel extras: a wall of
    // distinct posts reads better than the same caption twice in a row.
    return images.sort((a, b) => a.mediaIndex - b.mediaIndex);
  }, [source, collections, filteredTweets, view]);

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

  useEffect(() => {
    savePrefs({ view });
  }, [view]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => removeToast(current, id));
  }, []);

  const pushToast = useCallback(
    (type, message, { action, duration = 4000 } = {}) => {
      toastIdRef.current += 1;
      const id = toastIdRef.current;
      setToasts((current) => addToast(current, { id, type, message, action }));
      setTimeout(() => dismissToast(id), duration);
      return id;
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
      const nextView = nextViewFromKey(e.key, { typing, hasModifier });
      if (nextView) {
        setView(nextView);
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
    const byCollection = new Map(
      userCollections.map((c) => [c.id, c.imageKeys.length])
    );
    return {
      byCollection,
      favorites: favoritesCollection?.imageKeys.length ?? 0,
    };
  }, [userCollections, favoritesCollection]);

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
    const id = crypto.randomUUID();
    await putCollection(dbRef.current, {
      id,
      name,
      order,
      createdAt: new Date().toISOString(),
      imageKeys: [],
      color: color ?? DEFAULT_COLLECTION_COLOR,
    });
    await refreshCollections();
    return id;
  }

  async function handleCreateCollectionWithTarget(name) {
    const id = await handleCreateCollection(name);
    if (addTarget) {
      await addImagesToCollection(dbRef.current, id, addTarget);
      await refreshCollections();
    }
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
        // Read together and commit in one render: applying them one by one lays
        // the canvas out twice and shows a collection source as empty at first.
        const [cached, storedCollections] = await Promise.all([
          getAllTweets(db),
          listCollections(db),
        ]);
        if (cancelled) return;
        setAllTweets(cached);
        setCollections(storedCollections);
        setDbReady(true);
        syncNewest(cached[0]);
      } catch (error) {
        if (!cancelled) {
          setDbReady(true);
          showStatus(`Yerel veritabanı açılamadı: ${error.message}`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dbReady) return undefined;
    const schedule = window.requestIdleCallback ?? setTimeout;
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const handle = schedule(preloadOptionalChunks);
    return () => cancel(handle);
  }, [dbReady]);

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
    setPreviewId(image.tweetId);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightbox(null);
    setPreviewId(null);
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
    scheduleUnmark(selectedTweets.map((t) => t.id));
  }

  // Removal from X cannot be reversed, so it waits out the undo window. Until
  // then the tweet is only hidden: the database keeps it, and closing the tab
  // inside the window simply leaves the bookmark in place.
  function scheduleUnmark(ids) {
    const tweets = allTweets.filter((t) => ids.includes(t.id));
    if (tweets.length === 0) return;
    const targets = new Set(tweets.map((t) => t.id));
    for (const id of targets) pendingUnmarkRef.current.add(id);
    setAllTweets((current) => current.filter((t) => !targets.has(t.id)));
    setSelectedImageKeys(new Set());
    // Cleared here too: left set, it would reopen the panel on undo.
    setPreviewId((current) => (targets.has(current) ? null : current));

    const timer = setTimeout(() => commitUnmark(tweets), UNMARK_UNDO_MS);
    const toastId = pushToast(
      'success',
      tweets.length > 1
        ? `${tweets.length} bookmark kaldırıldı`
        : 'Bookmark kaldırıldı',
      {
        duration: UNMARK_UNDO_MS,
        action: {
          label: 'Geri al',
          onClick: () => {
            clearTimeout(timer);
            dismissToast(toastId);
            for (const id of targets) pendingUnmarkRef.current.delete(id);
            refreshFromDb();
          },
        },
      }
    );
  }

  // Delete on X first and drop the local record only on success: removing it
  // optimistically lost the record on failure and left zombies during a sync.
  async function commitUnmark(tweets) {
    const bulk = tweets.length > 1;
    try {
      const failed = [];
      let lastError = null;
      for (let i = 0; i < tweets.length; i += 1) {
        if (bulk)
          setBulkProgress(`${i + 1}/${tweets.length} unmark ediliyor...`);
        const result = await requestDeleteBookmark(tweets[i].id);
        if (result.ok) {
          await deleteTweetById(dbRef.current, tweets[i].id);
        } else {
          failed.push(tweets[i]);
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
    } finally {
      for (const { id } of tweets) pendingUnmarkRef.current.delete(id);
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
      pushToast(
        'success',
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

  const selectionActive = selectionMode && selectedImageKeys.size > 0;

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
      {view === 'grid' ? (
        <ImageGrid
          images={canvasImages}
          selectionMode={selectionMode}
          selectedIds={selectedImageKeys}
          onToggleSelect={handleToggleImageSelect}
          onOpenLightbox={handleOpenLightbox}
          focusRequest={focusRequest}
          viewKey={viewKey}
          onLoadOlder={loadOlderPage}
          loadingOlder={loadingOlder}
        />
      ) : (
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
      )}

      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-surface-2/90 via-surface-2/50 to-transparent" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-surface-2 via-surface-2/80 to-transparent" />

      <CanvasHeader
        count={canvasImages.length}
        sourceLabel={sourceLabel}
        selectionMode={selectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        onExportAll={handleExportAll}
        onOpenSettings={() => {
          setSettingsMounted(true);
          setSettingsOpen(true);
        }}
        onHome={handleRecenter}
        view={view}
        onViewChange={setView}
      />

      {dbReady && canvasImages.length === 0 && (
        <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted">
              {view === 'grid' ? 'Izgara' : 'Sonsuz tuval'}
            </p>
            <h1 className="font-serif text-[34px] italic leading-[1.1] tracking-[-0.02em] text-text">
              Küçük bir keşif alanı.
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              {emptyCopy}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({ ...EMPTY_FILTERS });
                  setSource('all');
                }}
                className="pointer-events-auto mt-5"
              >
                Filtreleri temizle
              </Button>
            )}
          </div>
        </div>
      )}

      {/* The selection bar takes the dock's place while there is a selection. */}
      {!selectionActive && (
        <CanvasDock
          search={filters.search}
          onSearchChange={(value) => handleFilterChange('search', value)}
          searchInputRef={searchInputRef}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={() => setFilters({ ...EMPTY_FILTERS })}
          activeFilterCount={filterBadge}
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
      )}

      {view === 'canvas' && (
        <CanvasToolbar
          zoom={zoom}
          onZoomChange={(next) => setZoom(clampZoom(next))}
          onRecenter={handleRecenter}
        />
      )}

      <PreviewPanel
        tweet={previewTweet}
        onClose={() => setPreviewId(null)}
        overlay
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <SelectionBar
        visible={selectionActive}
        count={selectedImageKeys.size}
        statusText={bulkProgress}
        onBulkAddToCollection={handleBulkAddToCollection}
        onBulkFigmaExport={handleFigmaExport}
        onBulkExportJson={handleBulkExportJson}
        onBulkExportCsv={handleBulkExportCsv}
        onBulkUnmark={handleBulkUnmark}
        onClear={handleToggleSelectionMode}
      />

      <AddToCollectionMenu
        open={Boolean(addTarget)}
        collections={userCollections}
        memberOf={addMemberOf}
        onToggle={handleToggleMembership}
        onCreate={handleCreateCollectionWithTarget}
        onClose={() => setAddTarget(null)}
      />

      {settingsMounted && (
        <Suspense fallback={null}>
          <SettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
        </Suspense>
      )}

      <ImageLightbox
        images={lightboxImages}
        initialKey={lightbox?.image.imageKey ?? null}
        originRect={lightbox?.originRect ?? null}
        favoriteKeys={favoriteKeys}
        onToggleFavorite={handleToggleFavorite}
        onAddToCollection={handleOpenAddToCollection}
        onPreview={handleImagePreview}
        onUnmark={(tweetId) => {
          scheduleUnmark([tweetId]);
          setLightbox(null);
        }}
        onClose={handleCloseLightbox}
        reservedRight={previewTweet ? PREVIEW_PANEL_WIDTH : 0}
        previewOpen={Boolean(previewTweet)}
      />
    </div>
  );
}
