# Tappy — Feature List

A Chrome (MV3) extension to browse, organize, and export your X (Twitter) bookmarks.
Image-first, local-only, light Apple-style UI. React 19 · Tailwind 4 · Base UI · Vite · Vitest.

---

## Views

- **Grid view** — virtualized tweet-card list (`@tanstack/react-virtual`).
- **Canvas view** — zoom/pan masonry wall of your bookmarked images (thiings.co / Eagle feel).
- **View switch + keyboard shortcut** — `Grid ⇄ Canvas` segmented control in the sidebar; press **G** / **C** to switch (ignored while typing).
- **Sort** — Newest→Oldest / Oldest→Newest / Most liked.

## Sidebar

- Tappy logo + wordmark at the top.
- **Search** across text / author / handle.
- **Sources**: `Tümü` (all), `Görseller` (image-only), `Favoriler` (quick-favorites), each with counts.
- **Collections** list with per-collection color dot + counts.
- Footer actions: `Seç` (selection mode), `Tümünü export et`, `Ayarlar`.
- **Görünüm** shortcut hint (G / C) above the footer.

## Canvas

- **Auto-layout masonry** in world coordinates; tiles sized by image aspect ratio.
- **Viewport windowing** — only on-screen tiles are mounted (scales to thousands of images).
- **Pan** — drag to pan with a click/drag threshold (a plain click opens the image, not a pan);
  rubber-band resistance at edges, spring-back, and flick momentum.
- **Zoom** — pinch-to-zoom (trackpad), clamped; **two-finger scroll pans** (not zoom).
  Zoom reflows the masonry rather than scaling it, and reanchors the vertical position so
  what you are looking at stays put.
- **Performance** — thumbnail-size images on tiles, lazy loading + skeleton placeholders,
  `React.memo` tiles + stable callbacks (no re-render on pan/zoom), rAF-batched pan and ratios.
- Click a tile → full-screen **lightbox**.

## Image lightbox (full-screen)

- Large image, grows from the clicked tile, dim + blur backdrop, animated open/close.
- **Right action bar** (with tooltips): Favorite · Add to collection · Copy · Download · Unmark ·
  Preview (tweet panel) · Open on X · Close.
- **Related-images strip** at the bottom for multi-image tweets; click a thumbnail to switch.
- **Arrow-key navigation** (← / →) between the tweet's images; Esc / backdrop / close button to dismiss.
- Accessible: `role="dialog"`, `aria-modal`, aria-label, focus-on-open + restore.
- Copy / download / lightbox always use full-resolution images.

## Collections

- **Named collections** — create, rename, delete.
- **Per-collection color** — 8-color palette, color dot in the sidebar, color picker in the create form and context menu.
- **Add to collection** — from the lightbox, single or **bulk** (selected images), via a multi-select menu.
- **Favoriler** — a pinned, non-deletable favorites collection; one-tap favorite from the lightbox.

## Bookmarks & data

- Reads **your own** X bookmarks via X's GraphQL API using your existing browser session cookies
  (`ct0` / `auth_token`) — no third-party server, all local.
- **IndexedDB** storage with incremental sync (fetch newest, page older).
- **Unmark** (remove bookmark) — single (from the lightbox) and **bulk** (selection bar).

## Export & media

- **Export all / selected** as **JSON** or **CSV**.
- **Figma export** — bundle selected images into a single dependency-free **ZIP** to drag into Figma.
- **Copy image** to clipboard and **download image** (per image / from the lightbox).

## Grid card

- Tweet card: author, avatar, text, media grid, stats, quoted tweet.
- Per-card actions: media copy / download, preview, open on X.
- **Selection mode** + floating **bulk-action bar** (bottom-right): add-to-collection, JSON/CSV export, unmark.
- Scroll-to-top / scroll-to-bottom buttons.

## Tweet preview panel

- Embedded tweet (author, text, media, stats) with height auto-sizing.
- Grid: in-flow right sidebar. Canvas: **floating overlay above the lightbox** (opened via the Preview action).

## Settings

- **X config is never bundled** — Bearer token, Bookmarks Query ID, Delete Bookmark Query ID are captured
  from your own x.com traffic, discovered from the client bundle, or pasted in from DevTools. Stored in
  `chrome.storage.local` and merged at request time; rediscovered automatically when they go stale.
- **Bookmarks Features** as a Turkish-labeled **checkbox list** (no raw JSON).
- **X login status** indicator; **Figma connect** affordance (stub).

## Design & motion

- **Light Apple aesthetic** — neutral palette, Apple blue accent, SF/Inter system fonts, soft shadows,
  translucent (blur) floating surfaces.
- **Motion system** — spring-like easings + duration tokens, animate only `transform`/`opacity`,
  fully **reduced-motion** safe.
- Built on **Base UI** primitives (Button, Input, Checkbox, Dropdown, Dialog) — restyled, no sticky header.

## Quality, security & tooling

- **Tests** — Vitest suite (214 tests) with English descriptions; `fake-indexeddb` + jsdom.
- **Tooling** — Prettier (enforced), ESLint with a relative-import rule; all imports relative.
- **Security-hardened for public release** — sandboxed tweet-embed iframe, MV3 `content_security_policy`
  allowlist, no hardcoded secrets, no `dangerouslySetInnerHTML`/`eval`, `rel="noreferrer"` on external links,
  session cookie value never leaves the background service worker, clean git history.

## Tech stack

Chrome MV3 extension · React 19 · Tailwind 4 (`@theme` tokens) · `@base-ui/react` · lucide-react ·
Vite · Vitest + jsdom + fake-indexeddb.
