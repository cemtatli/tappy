// buildZip and downloadBlob are injected to keep this module free of DOM coupling.

import { extFromUrl } from './media.js';

async function fetchBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function tryMcpExport(_images) {
  // Placeholder. Creating Figma nodes needs the plugin API — the REST API cannot
  // do it — so a ZIP the user drags into Figma is the shipping path for now.
  return false;
}

// ZIP giriş adları API'den gelen değerlerle kuruluyor; path ayırıcı ve
// kontrol karakterlerini at ki zip-slip mümkün olmasın.
function safeName(value) {
  return String(value ?? '').replace(/[^\w.-]/g, '_') || '_';
}

export async function exportToFigma(images, { buildZip, downloadBlob }) {
  const ok = await tryMcpExport(images);
  if (ok) return { path: 'mcp', count: images.length };

  const files = [];
  for (const img of images) {
    const bytes = await fetchBytes(img.url);
    const ext = extFromUrl(img.url);
    files.push({
      name: `${safeName(img.authorHandle)}-${safeName(img.tweetId)}-${img.mediaIndex}.${ext}`,
      bytes,
    });
  }
  const zipBytes = buildZip(files);
  downloadBlob(
    'figma-export.zip',
    new Blob([zipBytes], { type: 'application/zip' })
  );
  return { path: 'zip', count: files.length };
}
