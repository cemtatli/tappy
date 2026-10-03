import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cp,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(
  await readFile(join(root, 'manifest.json'), 'utf8')
);
if (!/^\d+\.\d+\.\d+$/.test(pkg.version) || manifest.version !== pkg.version) {
  throw new Error(
    'Package and manifest must have the same numeric release version.'
  );
}

const output = join(root, 'releases', pkg.version);
await mkdir(join(root, 'releases'), { recursive: true });
await mkdir(output); // Refuse to overwrite an existing version, including partial builds.
execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });

const dist = join(root, 'dist');
const builtManifest = JSON.parse(
  await readFile(join(dist, 'manifest.json'), 'utf8')
);
if (JSON.stringify(builtManifest) !== JSON.stringify(manifest)) {
  throw new Error('Built manifest differs from the source manifest.');
}
async function requireFile(path) {
  const target = resolve(dist, path);
  if (
    relative(dist, target).startsWith('..') ||
    !(await stat(target)).isFile()
  ) {
    throw new Error(`Invalid or missing packaged file: ${path}`);
  }
}
for (const path of [
  'index.html',
  builtManifest.background.service_worker,
  ...Object.values(builtManifest.icons),
  ...Object.values(builtManifest.action.default_icon),
]) {
  await requireFile(path);
}

// Check the generated page's local script and stylesheet references.
const html = await readFile(join(dist, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^(?:https?:|data:)/.test(match[1]))
    throw new Error('External UI asset in release.');
  await requireFile(match[1].replace(/^\//, ''));
}
// Background modules are copied, not bundled; their imports must resolve in the ZIP.
for (const dir of ['src/background', 'src/shared']) {
  for (const name of await readdir(join(dist, dir))) {
    if (!name.endsWith('.js')) continue;
    const source = await readFile(join(dist, dir, name), 'utf8');
    for (const match of source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
      if (!match[1].startsWith('.'))
        throw new Error(`Unbundled dependency: ${match[1]}`);
      await requireFile(join(dir, match[1]));
    }
  }
}
await cp(join(root, 'LICENSE'), join(dist, 'LICENSE'));
await cp(join(root, 'docs/install.md'), join(dist, 'INSTALL.md'));

const name = `tappy-${pkg.version}-chrome.zip`;
const archive = join(output, name);
// Explicit allowlist keeps local files and development dependencies out of the archive.
execFileSync(
  'zip',
  [
    '-X',
    '-qr',
    archive,
    'manifest.json',
    'index.html',
    'assets',
    'src/background',
    'src/shared',
    'src/assets/icons',
    'LICENSE',
    'INSTALL.md',
  ],
  { cwd: dist }
);
execFileSync('unzip', ['-t', archive], { stdio: 'inherit' });
const digest = createHash('sha256')
  .update(await readFile(archive))
  .digest('hex');
await writeFile(join(output, 'SHA256SUMS.txt'), `${digest}  ${name}\n`, {
  flag: 'wx',
});
console.log(`Release: ${archive}\nSHA-256: ${digest}`);
