import { cp, mkdir } from 'node:fs/promises';

async function copyStatic() {
  await mkdir('dist/src/background', { recursive: true });
  await mkdir('dist/src/shared', { recursive: true });
  await mkdir('dist/src/assets/icons', { recursive: true });
  await cp('manifest.json', 'dist/manifest.json');
  await cp('src/background', 'dist/src/background', { recursive: true });
  await cp('src/shared', 'dist/src/shared', { recursive: true });
  await cp('src/assets/icons', 'dist/src/assets/icons', { recursive: true });
}

copyStatic();
