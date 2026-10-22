import { useEffect, useState } from 'react';
import { X, Info, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import { Input } from './ui/Input.jsx';
import { Checkbox } from './ui/Checkbox.jsx';
import { XLogo } from './icons/XLogo.jsx';
import { loadXSettings, saveXSettings } from '../../shared/xSettings.js';
import {
  requestXStatus,
  requestDiscoverXConfig,
} from '../../shared/messages.js';
import { BOOKMARKS_FEATURES } from '../../background/xConfig.js';
import { featureLabel } from '../lib/featureLabels.js';
import { connectionState, filledCount } from '../lib/xConnection.js';

function InfoHint({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <Button
        variant="ghost"
        size="sm"
        aria-label={label}
        title={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="size-6 min-w-6 px-0 text-muted hover:text-text"
      >
        <Info size={13} />
      </Button>
      {open && (
        <>
          <span
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-5 top-0 z-20 w-72 rounded-lg border border-line bg-white p-3 text-[11px] leading-relaxed text-text shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            {children}
          </div>
        </>
      )}
    </span>
  );
}

function Disclosure({ id, title, open, onToggle, children }) {
  return (
    <section className="border-t border-line">
      <Button
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="w-full justify-start gap-1.5 rounded-lg px-0 py-3 text-sm font-semibold"
      >
        <ChevronRight
          size={14}
          className={`text-muted transition-transform duration-[var(--dur-fast)] ${open ? 'rotate-90' : ''}`}
        />
        {title}
      </Button>
      {open && (
        <div id={id} className="pb-4">
          {children}
        </div>
      )}
    </section>
  );
}

const CARD_COPY = {
  connected: {
    title: 'Bağlı',
    detail: 'Giriş yapılı · değerler otomatik alındı',
  },
  incomplete: {
    title: 'Kurulum tamamlanmadı',
  },
  'logged-out': {
    title: 'x.com oturumu yok',
    detail: 'Yer imlerini okumak için x.com hesabına giriş yapman gerekiyor.',
  },
};

function ConnectionCard({ state, filled, busy, note, onRefresh }) {
  if (state === 'loading') {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-[var(--radius)] border border-line bg-surface-2 p-4">
        <div className="h-5 w-5 rounded bg-line" />
        <div className="h-3 w-32 rounded bg-line" />
      </div>
    );
  }

  const copy = CARD_COPY[state];
  const detail =
    state === 'incomplete' ? `${filled}/3 değer alındı` : copy.detail;

  return (
    <div className="mb-5 rounded-[var(--radius)] border border-line bg-surface-2 p-4">
      <div className="flex items-start gap-3">
        <XLogo size={20} className="mt-0.5 shrink-0 text-text" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">{copy.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{detail}</p>
        </div>
        {state === 'logged-out' ? (
          <Button
            size="sm"
            onClick={() => window.open('https://x.com/login', '_blank')}
          >
            x.com&apos;a giriş yap
          </Button>
        ) : (
          <Button
            variant={state === 'connected' ? 'outline' : 'default'}
            size="sm"
            onClick={onRefresh}
            disabled={busy}
          >
            {busy
              ? 'Taranıyor...'
              : state === 'connected'
                ? 'Yenile'
                : 'Otomatik doldur'}
          </Button>
        )}
      </div>
      {note && (
        <p className="mt-3 text-xs leading-relaxed text-muted">{note}</p>
      )}
    </div>
  );
}

export function SettingsPanel({ open, onClose }) {
  const [bearerToken, setBearerToken] = useState('');
  const [bookmarksQueryId, setBookmarksQueryId] = useState('');
  const [deleteBookmarkQueryId, setDeleteBookmarkQueryId] = useState('');
  const [features, setFeatures] = useState({ ...BOOKMARKS_FEATURES });
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoverNote, setDiscoverNote] = useState('');
  // null until the user picks a side, so the connection state decides the default.
  const [advancedOpen, setAdvancedOpen] = useState(null);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    setSaveStatus('');
    setDiscoverNote('');
    setAdvancedOpen(null);
    setFeaturesOpen(false);

    loadXSettings().then((s) => {
      setBearerToken(s.bearerToken ?? '');
      setBookmarksQueryId(s.bookmarksQueryId ?? '');
      setDeleteBookmarkQueryId(s.deleteBookmarkQueryId ?? '');
      setFeatures({ ...BOOKMARKS_FEATURES, ...(s.bookmarksFeatures ?? {}) });
    });

    requestXStatus().then((res) => {
      setIsLoggedIn(res.ok ? res.data.isLoggedIn : false);
    });
  }, [open]);

  if (!open) return null;

  const config = { bearerToken, bookmarksQueryId, deleteBookmarkQueryId };
  const state = connectionState({ isLoggedIn, ...config });
  const advancedVisible = advancedOpen ?? state !== 'connected';

  async function handleSave() {
    setSaveStatus('');

    await saveXSettings({
      bearerToken: bearerToken.trim(),
      bookmarksQueryId: bookmarksQueryId.trim(),
      deleteBookmarkQueryId: deleteBookmarkQueryId.trim(),
      bookmarksFeatures: features,
    });
    setSaveStatus('Kaydedildi');
  }

  async function handleAutoFill() {
    setDiscovering(true);
    setDiscoverNote('x.com bookmarks açılıyor, değerler yakalanıyor...');
    // queryIds only surface once a real request fires, so open the bookmarks tab
    // synchronously inside the user gesture and scrape the bundle in parallel.
    window.open('https://x.com/i/bookmarks', '_blank');
    requestDiscoverXConfig().catch(() => {});
    try {
      let filled = 0;
      for (let i = 0; i < 10; i += 1) {
        await new Promise((r) => setTimeout(r, 1000));
        const s = await loadXSettings();
        setBearerToken(s.bearerToken ?? '');
        setBookmarksQueryId(s.bookmarksQueryId ?? '');
        setDeleteBookmarkQueryId(s.deleteBookmarkQueryId ?? '');
        filled = filledCount(s);
        if (filled === 3) break;
      }
      setDiscoverNote(
        filled === 3
          ? '3 alan da alındı, kaydedildi.'
          : `${filled}/3 yakalandı. Açılan x.com sekmesinde bookmarks tam yüklensin, sonra tekrar bas.`
      );
    } catch (err) {
      setDiscoverNote(`Hata: ${err.message}`);
    } finally {
      setDiscovering(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fade-in_var(--dur-base)_var(--ease-out)]"
      onClick={handleBackdropClick}
    >
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius)] border border-line bg-white p-6 text-text shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-[settings-in_var(--dur-base)_var(--ease-out)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Ayarlar</h2>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Kapat"
            onClick={onClose}
            className="size-9 min-w-9 px-0"
          >
            <X size={18} />
          </Button>
        </div>

        <ConnectionCard
          state={state}
          filled={filledCount(config)}
          busy={discovering}
          note={discoverNote}
          onRefresh={handleAutoFill}
        />

        <Disclosure
          id="settings-advanced"
          title="Gelişmiş"
          open={advancedVisible}
          onToggle={() => setAdvancedOpen(!advancedVisible)}
        >
          <p className="mb-4 text-xs leading-relaxed text-muted">
            Bu değerleri eklenti kendi yakalar. Yalnızca &quot;X arayüzü
            değişti&quot; hatası aldığında ve otomatik doldurma işe
            yaramadığında elle gir.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-xs text-muted">
                Bearer token
                <InfoHint label="Bearer token nasıl alınır?">
                  <p className="mb-1 font-semibold text-text">
                    Bearer token nasıl alınır?
                  </p>
                  <ol className="list-decimal space-y-0.5 pl-4">
                    <li>
                      x.com&apos;a giriş yap, <b>x.com/i/bookmarks</b> sayfasını
                      aç.
                    </li>
                    <li>
                      <b>F12</b> → <b>Network</b> sekmesi. Sayfayı yenile.
                    </li>
                    <li>
                      Listede <b>Bookmarks</b> isteğine tıkla → <b>Headers</b> →{' '}
                      <b>Request Headers</b>.
                    </li>
                    <li>
                      <code>authorization: Bearer AAAA...</code> satırındaki{' '}
                      <b>Bearer&apos;dan sonraki tüm değeri</b> kopyala.
                    </li>
                  </ol>
                  <p className="mt-1 text-muted">
                    Bu token genelde sabittir, nadir değişir.
                  </p>
                </InfoHint>
              </span>
              <Input
                aria-label="Bearer token"
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                className="w-full"
                placeholder="Bearer token..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-xs text-muted">
                Bookmarks Query ID
                <InfoHint label="Bookmarks Query ID nasıl alınır?">
                  <p className="mb-1 font-semibold text-text">
                    Bookmarks Query ID nasıl alınır?
                  </p>
                  <ol className="list-decimal space-y-0.5 pl-4">
                    <li>
                      Yukarıdaki <b>Bookmarks</b> isteğinin URL&apos;sine bak.
                    </li>
                    <li>
                      URL şu şekildedir:{' '}
                      <code>
                        .../graphql/<b>XXXX</b>/Bookmarks
                      </code>
                    </li>
                    <li>
                      <code>graphql/</code> ile <code>/Bookmarks</code>{' '}
                      arasındaki kod = Query ID.
                    </li>
                  </ol>
                  <p className="mt-1 text-muted">
                    X arayüz güncellemelerinde değişebilir.
                  </p>
                </InfoHint>
              </span>
              <Input
                aria-label="Bookmarks Query ID"
                value={bookmarksQueryId}
                onChange={(e) => setBookmarksQueryId(e.target.value)}
                className="w-full"
                placeholder="Query ID..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-xs text-muted">
                Delete Bookmark Query ID
                <InfoHint label="Delete Bookmark Query ID nasıl alınır?">
                  <p className="mb-1 font-semibold text-text">
                    Delete Bookmark Query ID nasıl alınır?
                  </p>
                  <ol className="list-decimal space-y-0.5 pl-4">
                    <li>Network sekmesi açıkken bir bookmark&apos;ı kaldır.</li>
                    <li>
                      Listede <b>DeleteBookmark</b> isteğini bul.
                    </li>
                    <li>
                      URL:{' '}
                      <code>
                        .../graphql/<b>YYYY</b>/DeleteBookmark
                      </code>{' '}
                      → aradaki kod = Query ID.
                    </li>
                  </ol>
                  <p className="mt-1 text-muted">
                    Unmark bu ID olmadan çalışmaz.
                  </p>
                </InfoHint>
              </span>
              <Input
                aria-label="Delete Bookmark Query ID"
                value={deleteBookmarkQueryId}
                onChange={(e) => setDeleteBookmarkQueryId(e.target.value)}
                className="w-full"
                placeholder="Query ID..."
              />
            </div>
          </div>
        </Disclosure>

        <Disclosure
          id="settings-features"
          title="Bookmarks Features"
          open={featuresOpen}
          onToggle={() => setFeaturesOpen((v) => !v)}
        >
          <div className="flex flex-col gap-2">
            {Object.keys(BOOKMARKS_FEATURES).map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2"
              >
                <Checkbox
                  checked={features[key]}
                  onCheckedChange={(next) =>
                    setFeatures((f) => ({ ...f, [key]: next }))
                  }
                />
                <span className="text-xs text-text">{featureLabel(key)}</span>
              </label>
            ))}
          </div>
        </Disclosure>

        <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
          {saveStatus && (
            <span className="text-sm text-accent">{saveStatus}</span>
          )}
          <Button onClick={handleSave}>Kaydet</Button>
        </div>
      </div>
    </div>
  );
}
