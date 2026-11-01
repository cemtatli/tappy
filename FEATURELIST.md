# Tappy — Feature List

A Chrome (MV3) extension to browse, organize, and export your X (Twitter) bookmarks.
Image-first, local-only, warm minimal UI. React 19 · Tailwind 4 · Base UI · Vite · Vitest.

---

## Infinite canvas

- **Endless surface** — free pan in every direction; there are no page edges or bounds.
- **Drag to pan** with a click/drag threshold, so a plain click still opens an image.
  A fast drag keeps its momentum and glides to a stop.
- **Zoom** from 20% to 260% — trackpad pinch or `⌘` / `Ctrl` + wheel zooms around the
  pointer; two-finger scroll pans. Background double-click and the bottom-right
  toolbar (`−` / `+`) also zoom.
- **Organic scatter layout** — cards have varied widths and image heights, arranged in
  loose, jittered rows. The layout is deterministic per image and does not overlap.
- **Viewport windowing** — only tiles near the visible area are mounted, so a large
  collection stays smooth while panning.
- **Recenter / home** — the Tappy logo or the locate button eases back to the centre
  of the current result set. Changing a filter, search, source, or sort recenters too.
- **Surprise me** — picks a random image from the current results (never the same one
  twice in a row), then animates pan and zoom to centre it with a temporary orange
  focus ring.
- **Selection mode** — checkboxes appear on every card; selected cards get a ring.
- **Keyboard** — `⌘K` / `Ctrl+K` or `/` focuses search; `S` surprises; `G` / `C` switch
  between grid and canvas; `Esc` closes the filter panel or lightbox.

## Grid

- **Chronological list** — a virtualized grid that follows the current sort, newest
  bookmark first by default, with each card showing the date it was bookmarked.
- The header button switches between grid and canvas; the choice is remembered.
- **Daha eski kayıtlar** at the end of the list fetches the next page on request.

## Cards

- White rounded card with the image on top and the tweet text below.
- Text is clamped to three lines, followed by `@handle` and the like count.
- Multi-image posts show a `1/2` badge; extra frames appear as their own cards with
  the author name as the caption.
- Thumbnail-size images with lazy loading and a calm skeleton while loading.
- Click a card to open the lightbox at full resolution; hover lifts the card
  (`prefers-reduced-motion` is respected).

## Top bar

- Tappy mark + wordmark: click to return to the home view.
- Live result count: `N görsel · <source>`.
- **Seç** — toggle selection mode.
- **Tümünü JSON olarak indir** — export the currently filtered tweets.
- **Ayarlar** — open settings.

## Search, filters & sort

- **Bottom dock** keeps search, filters, and surprise within reach while the canvas
  fills the screen.
- **Search** across text, author name, and `@handle`; `⌘K` / `Ctrl+K` or `/` jumps to it.
- **Filter button** opens a popover panel (`Esc` or the backdrop dismisses it). An orange badge shows active filters.
- **Sources** — `Tümü`, `Favoriler`, or any collection, with counts.
- **Collections** — create, rename, recolor (8-color palette), and delete directly
  from the panel.
- **Sort** — `Yeni` (newest), `Eski` (oldest), or `Beğeni` (most liked).
- **Advanced filters** — author / `@handle`, inclusive local publication-date range,
  and minimum likes, folded under `Daha fazla filtre`.
- **Reset** — `Temizle`, shown only while a filter is active, clears search and advanced filters.
- **Daha eski kayıtlar** — fetch the next older page from X without leaving the canvas.
- Searches and filters apply to locally loaded records.

## Image lightbox

- Large image, grows from the clicked tile, dim + blur backdrop, animated open/close.
- **Tweet panel** — the X embed opens beside the image, with the bookmark date and an
  Open on X link in its header.
- **Right action bar** (with tooltips): Favorite · Add to collection · Copy · Download ·
  Toggle tweet panel · Unmark · Close.
- Opens on the cached thumbnail at final size, then swaps to the full image when ready.
- **Related-images strip** at the bottom for multi-image tweets; click a thumbnail to switch.
- **Arrow-key navigation** (← / →) between the tweet's images; `Esc`, backdrop, or the
  close button dismisses.
- Accessible: `role="dialog"`, `aria-modal`, labelled dialog, focus on open and restore
  on close, themed keyboard focus ring.
- Copy and download always use the full image.

## Collections

- **Named collections** — create, rename, delete.
- **Per-collection color** — 8-color palette, shown as a dot in the filter panel.
- **Add to collection** — from the lightbox, or in bulk from selection mode. A new
  collection can be created right in the menu and receives the images at once.
- **Favoriler** — a pinned, non-deletable favorites collection; one-tap favorite from
  the lightbox.

## Selection & bulk actions

- Select images directly on the canvas; the floating selection bar shows the count.
- **Koleksiyona ekle** — add every selected image to one or more collections.
- **Figma'ya aktar** — bundle selected images into a single dependency-free ZIP.
- **JSON export / CSV export** — export the distinct parent tweets of the selection.
- **Unmark** — remove the selected bookmarks, with the same undo window as a single one.
- **Vazgeç** — clear the selection and leave selection mode.

## Bookmarks & data

- Reads **your own** X bookmarks via X's GraphQL API using your existing browser session
  cookies (`ct0` / `auth_token`) — no third-party server, all local.
- **IndexedDB** storage with incremental sync: fetch the newest page on open, then page
  backwards through older records.
- **Unmark** (remove bookmark) — single, from the lightbox, or in bulk. There is no
  confirmation: the bookmark disappears at once, and X is only called after a 5-second
  **Geri al** (undo) window. Closing the tab inside that window keeps the bookmark.
- **Bookmark date** — decoded from X's `sortIndex`, so records cached earlier have it
  too. Included in JSON and CSV exports as `bookmarkedAt`.

## Export & media

- **Export all / selected** as **JSON** or **CSV**.
- **Figma export** — bundle selected images into a single ZIP to drag into Figma.
- **Copy image** to clipboard and **download image** from the lightbox.

## Tweet preview panel

- Embedded tweet (author, text, media, stats) with height auto-sizing.
- Opens as a floating overlay above the lightbox from the Preview action.

## Settings

- **X config is never bundled** — Bearer token, Bookmarks Query ID, Delete Bookmark
  Query ID are captured from your own x.com traffic, discovered from the client bundle,
  or pasted in from DevTools. Stored in `chrome.storage.local` and merged at request
  time; rediscovered automatically when they go stale.
- **Bookmarks Features** as a Turkish-labelled checkbox list (no raw JSON).
- **X login status** indicator; **Figma connect** affordance (stub).

## Design & motion

- **Warm cream canvas** (`#f7f5f0`) with a faint dot grid, near-white cards, and an
  orange accent (`#e8740c`).
- **Knowspace-inspired calm** — generous negative space, rounded floating surfaces,
  soft shadows, system SF/Inter typography, and a serif italic empty-state line.
- **Motion** — eased pan/zoom, card lift, lightbox grow, toast slide; entrances use
  short durations and reduced-motion users get softer fades.
- Built on **Base UI** primitives (Button, Input, Checkbox, Dropdown, Dialog) — restyled.

## Quality, security & tooling

- **Tests** — Vitest suite (255 tests) with English descriptions; `fake-indexeddb` + jsdom.
- **Tooling** — Prettier (enforced), ESLint with a relative-import rule; all imports relative.
- **Security-hardened for public release** — sandboxed tweet-embed iframe, MV3
  `content_security_policy` allowlist, no hardcoded secrets, no
  `dangerouslySetInnerHTML`/`eval`, `rel="noreferrer"` on external links, session cookie
  value never leaves the background service worker, clean git history.

## Tech stack

Chrome MV3 extension · React 19 · Tailwind 4 (`@theme` tokens) · `@base-ui/react` ·
lucide-react · Vite · Vitest + jsdom + fake-indexeddb.
