/**
 * Zips dist/ into ecash-cat-wallet-<version>.zip (for a GitHub release or the
 * Chrome Web Store). Written in-process with node:zlib so it needs no zip or
 * bsdtar on the machine.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

const root = join(import.meta.dir, '..');
const dist = join(root, 'dist');
const { version } = JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8'));
const out = join(root, `ecash-cat-wallet-${version}.zip`);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

const u16 = (n: number) => Buffer.from([n & 0xff, (n >> 8) & 0xff]);
const u32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0);
  return b;
};

// DOS date/time of "now", as every zip entry carries one.
const d = new Date();
const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();

const locals: Buffer[] = [];
const centrals: Buffer[] = [];
let offset = 0;
for (const path of files(dist).sort()) {
  const name = Buffer.from(relative(dist, path).split('\\').join('/'), 'utf8');
  const data = readFileSync(path);
  const packed = deflateRawSync(data, { level: 9 });
  const crc = crc32(data);
  const common = Buffer.concat([u16(20), u16(0x0800), u16(8), u16(dosTime), u16(dosDate), u32(crc), u32(packed.length), u32(data.length), u16(name.length), u16(0)]);
  const local = Buffer.concat([u32(0x04034b50), common, name, packed]);
  centrals.push(Buffer.concat([u32(0x02014b50), u16(20), common, u16(0), u16(0), u16(0), u32(0), u32(offset), name]));
  locals.push(local);
  offset += local.length;
}
const central = Buffer.concat(centrals);
const end = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(centrals.length), u16(centrals.length), u32(central.length), u32(offset), u16(0)]);
writeFileSync(out, Buffer.concat([...locals, central, end]));
console.log(`${out} (${centrals.length} files)`);
