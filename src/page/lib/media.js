export function displayUrl(url, size = 'small') {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'pbs.twimg.com') return url;
    parsed.searchParams.set('name', size);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function extFromUrl(url) {
  const formatMatch = /[?&]format=(\w+)/.exec(url);
  if (formatMatch) return formatMatch[1];
  const pathMatch = /\.(\w+)$/.exec(new URL(url).pathname);
  if (pathMatch) return pathMatch[1];
  return 'jpg';
}

async function fetchBlob(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.blob();
}

async function toPngBlob(blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (png) =>
        png ? resolve(png) : reject(new Error('PNG dönüşümü başarısız')),
      'image/png'
    );
  });
}

export async function copyImageToClipboard(url) {
  const blob = await fetchBlob(url);
  const png = blob.type === 'image/png' ? blob : await toPngBlob(blob);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
}

export async function downloadImage(url, filename) {
  const blob = await fetchBlob(url);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
