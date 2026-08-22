import { useEffect, useState } from 'react';
import { X, Info } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import { Input } from './ui/Input.jsx';
import { Checkbox } from './ui/Checkbox.jsx';
import { loadXSettings, saveXSettings } from '../../shared/xSettings.js';
import {
  requestXStatus,
  requestDiscoverXConfig,
} from '../../shared/messages.js';
import { BOOKMARKS_FEATURES } from '../../background/xConfig.js';
import { featureLabel } from '../lib/featureLabels.js';

function InfoHint({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-muted hover:text-text"
      >
        <Info size={13} />
      </button>
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

export function SettingsPanel({ open, onClose }) {
  const [bearerToken, setBearerToken] = useState('');
  const [bookmarksQueryId, setBookmarksQueryId] = useState('');
  const [deleteBookmarkQueryId, setDeleteBookmarkQueryId] = useState('');
  const [features, setFeatures] = useState({ ...BOOKMARKS_FEATURES });
  const [saveStatus, setSaveStatus] = useState('');
  const [xStatus, setXStatus] = useState(null);
  const [figmaNote, setFigmaNote] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discoverNote, setDiscoverNote] = useState('');

  useEffect(() => {
    if (!open) return;

    setSaveStatus('');
    setFigmaNote('');
    setDiscoverNote('');

    loadXSettings().then((s) => {
      setBearerToken(s.bearerToken ?? '');
      setBookmarksQueryId(s.bookmarksQueryId ?? '');
      setDeleteBookmarkQueryId(s.deleteBookmarkQueryId ?? '');
      setFeatures({ ...BOOKMARKS_FEATURES, ...(s.bookmarksFeatures ?? {}) });
    });

    requestXStatus().then((res) => {
      if (res.ok) {
        setXStatus(res.data.isLoggedIn ? 'logged-in' : 'logged-out');
      } else {
        setXStatus('logged-out');
      }
    });
  }, [open]);

  if (!open) return null;

  async function handleSave() {
    setSaveStatus('');

    const patch = {
      bearerToken: bearerToken.trim(),
      bookmarksQueryId: bookmarksQueryId.trim(),
      deleteBookmarkQueryId: deleteBookmarkQueryId.trim(),
      bookmarksFeatures: features,
    };

    await saveXSettings(patch);
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
        filled = [
          s.bearerToken,
          s.bookmarksQueryId,
          s.deleteBookmarkQueryId,
        ].filter(Boolean).length;
        if (filled === 3) break;
      }
      setDiscoverNote(
        filled === 3
          ? '3 alan otomatik dolduruldu. Kaydet.'
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm motion-safe:animate-[fade-in_var(--dur-base)_var(--ease-out)]"
      onClick={handleBackdropClick}
    >
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius)] border border-line bg-white p-6 text-text shadow-[0_8px_30px_rgba(0,0,0,0.12)] motion-safe:animate-[settings-in_var(--dur-base)_var(--ease-out)]">
        {/* Başlık */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Ayarlar</h2>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="text-muted hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        {/* X Durum Satırı */}
        <p className="mb-5 text-sm text-muted">
          {xStatus === 'logged-in'
            ? 'X: giriş yapılı'
            : xStatus === 'logged-out'
              ? 'X: giriş yok'
              : 'X: durum yükleniyor...'}
        </p>

        {/* X API Override Alanları */}
        <section className="mb-6">
          <h3 className="mb-1 text-sm font-semibold text-text">
            X API Ayarları
          </h3>
          <p className="mb-4 text-xs text-muted">
            Bu alanlar isteğe bağlıdır; boş bırakıldığında yerleşik değerler
            kullanılır. "X arayüzü değişti" hatası aldığınızda DevTools Network
            sekmesinden güncel değerleri buraya yapıştırabilirsiniz.
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

            <div className="mt-1 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoFill}
                disabled={discovering}
              >
                {discovering ? 'Taranıyor...' : 'Otomatik doldur / Yenile'}
              </Button>
              {discoverNote && (
                <span className="text-xs text-muted">{discoverNote}</span>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-muted">
              x.com&apos;a giriş yapmışken bu buton token ve Query ID&apos;leri
              otomatik çeker. Ayrıca senkron 401/404 alınca değerler
              kendiliğinden yenilenir.
            </p>
          </div>
        </section>

        {/* Bookmarks Features */}
        <section className="mb-6 border-t border-line pt-4">
          <h3 className="mb-3 text-sm font-semibold text-text">
            Bookmarks Features
          </h3>
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
        </section>

        {/* Figma Stub */}
        <section className="mb-6 border-t border-line pt-4">
          <h3 className="mb-3 text-sm font-semibold text-text">Figma</h3>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFigmaNote(
                  'Export şu an ZIP ile çalışıyor; doğrudan Figma bağlantısı yakında.'
                )
              }
            >
              Figma&apos;ya bağlan
            </Button>
            <span className="text-xs text-muted">Bağlı değil</span>
          </div>
          {figmaNote && <p className="mt-2 text-xs text-muted">{figmaNote}</p>}
        </section>

        {/* Kaydet */}
        <div className="flex items-center justify-end gap-3">
          {saveStatus && (
            <span className="text-sm text-accent">{saveStatus}</span>
          )}
          <Button onClick={handleSave}>Kaydet</Button>
        </div>
      </div>
    </div>
  );
}
