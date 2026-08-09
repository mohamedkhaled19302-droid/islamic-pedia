/** Bake night-theme font variants: for each p{N}.woff2 produce p{N}-n.woff2
 *  where CPAL palette 0 (the default, used by Chromium for COLRv0) is
 *  overwritten with palette 1 (the dark-theme colors).
 *
 *  Chromium ignores CSS `font-palette` for COLRv0 fonts, so we bake the
 *  night palette into a separate font file and load it via @font-face.
 *
 *  Implementation: decompress the single WOFF2 Brotli block, edit the CPAL
 *  palette-0 color records in place, recompress, and rebuild the file with an
 *  identical table directory. All other table bytes are preserved verbatim.
 */

import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT_DIR = path.join(ROOT, "public/data/quran/v4/fonts");

const KNOWN = ["cmap","head","hhea","hmtx","maxp","name","OS/2","post","cvt ","fpgm","glyf","loca","prep","CFF ","VORG","EBDT","EBLC","gasp","hdmx","kern","LTSH","PCLT","VDMX","vhea","vmtx","BASE","GDEF","GPOS","GSUB","EBSC","JSTF","MATH","CBDT","CBLC","COLR","CPAL","SVG ","sbix","acnt","avar","bdat","bloc","bsln","cvar","fdsc","feat","fmtx","fvar","gvar","hsty","just","lcar","mort","morx","opbd","prop","trak","Zapf","Silf","Glat","Gloc","Feat","Sill"];

function readBase128(buf, off) {
  let v = 0;
  for (let i = 0; i < 5; i++) {
    const b = buf[off + i];
    if (i === 0 && b === 0x80) throw new Error("bad base128");
    if (v & 0xfe000000) throw new Error("overflow");
    v = (v << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) return { value: v, next: off + i + 1 };
  }
  throw new Error("base128 too long");
}

function base128Bytes(v) {
  const out = [];
  do {
    out.unshift(v & 0x7f);
    v = Math.floor(v / 0x80);
  } while (v > 0);
  for (let i = 0; i < out.length - 1; i++) out[i] |= 0x80;
  return out;
}

/** Parse a WOFF2 file; returns header + directory + decompressed table block. */
function parseWoff2(buf) {
  if (buf.toString("ascii", 0, 4) !== "wOF2") throw new Error("not woff2");
  const u16 = (o) => buf.readUInt16BE(o);
  const u32 = (o) => buf.readUInt32BE(o);
  const numTables = u16(12);
  const totalCompressedSize = u32(20);
  const dirs = [];
  let off = 48;
  for (let i = 0; i < numTables; i++) {
    const flags = buf[off++];
    let tag;
    if ((flags & 0x3f) === 0x3f) {
      tag = buf.toString("ascii", off, off + 4);
      off += 4;
    } else {
      tag = KNOWN[flags & 0x3f];
    }
    const t = readBase128(buf, off);
    off = t.next;
    const origLength = t.value;
    const transformVersion = (flags >> 6) & 3;
    const isGlyfTransform = (tag === "glyf" || tag === "loca") && transformVersion !== 3;
    let transformLength = null;
    if (transformVersion !== 0 || isGlyfTransform) {
      const t2 = readBase128(buf, off);
      off = t2.next;
      transformLength = t2.value;
    }
    dirs.push({ tag, flags, origLength, transformLength, transformVersion });
  }
  const dataStart = off;
  let block;
  try {
    block = zlib.brotliDecompressSync(buf.subarray(dataStart, dataStart + totalCompressedSize));
  } catch (e) {
    throw new Error("brotli block failed");
  }
  return { numTables, totalCompressedSize, dirs, block, dirSize: dataStart - 48 };
}

/** Rebuild a WOFF2 buffer from header values + directory + block. */
function buildWoff2(numTables, totalSfntSize, dirs, block, dstPath) {
  const dirBytes = [];
  for (const d of dirs) {
    dirBytes.push(d.flags);
    if ((d.flags & 0x3f) === 0x3f) {
      dirBytes.push(...Buffer.from(d.tag, "ascii"));
    }
    dirBytes.push(...base128Bytes(d.origLength));
    if (d.transformLength != null) dirBytes.push(...base128Bytes(d.transformLength));
  }
  const dirBuf = Buffer.from(dirBytes);
  const compressed = zlib.brotliCompressSync(block, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } });
  const totalCompressedSize = compressed.length;
  const length = 48 + dirBuf.length + totalCompressedSize;
  const header = Buffer.alloc(48);
  header.write("wOF2", 0, "ascii");
  header.writeUInt32BE(0x10000, 4);
  header.writeUInt32BE(length, 8);
  header.writeUInt16BE(numTables, 12);
  header.writeUInt16BE(0, 14);
  header.writeUInt32BE(totalSfntSize, 16);
  header.writeUInt32BE(totalCompressedSize, 20);
  // majorVersion/minorVersion (24,26) = 0
  // metaOffset/metaLength/metaOrigLength (28,32,36) = 0
  // privOffset/privLength (40,44) = 0
  fs.writeFileSync(dstPath, Buffer.concat([header, dirBuf, compressed]));
}

/** Edit CPAL palette `fromIdx` into palette 0 (in place within the block). */
function bakePalette(block, fromIdx) {
  const cp = block;
  const version = cp.readUInt16BE(0);
  if (version !== 0) throw new Error("unexpected CPAL version " + version);
  const numPaletteEntries = cp.readUInt16BE(2);
  const numPalettes = cp.readUInt16BE(4);
  const numColorRecords = cp.readUInt16BE(6);
  const colorRecordsArrayOffset = cp.readUInt32BE(8);
  if (fromIdx >= numPalettes) throw new Error(`palette ${fromIdx} out of range (${numPalettes})`);
  const colorIndex = [];
  for (let p = 0; p < numPalettes; p++) colorIndex.push(cp.readUInt16BE(12 + p * 2));
  const srcStart = colorRecordsArrayOffset + colorIndex[fromIdx] * 4;
  const dstStart = colorRecordsArrayOffset + colorIndex[0] * 4;
  const n = numPaletteEntries * 4;
  if (srcStart + n > colorRecordsArrayOffset + numColorRecords * 4) throw new Error("source records out of range");
  const src = Buffer.from(cp.subarray(srcStart, srcStart + n));
  src.copy(cp, dstStart, 0, n);
}

function processPage(n) {
  const src = path.join(FONT_DIR, `p${n}.woff2`);
  const dst = path.join(FONT_DIR, `p${n}-n.woff2`);
  if (!fs.existsSync(src)) throw new Error(`missing ${src}`);
  if (fs.existsSync(dst)) return "skip";
  const buf = fs.readFileSync(src);
  const { numTables, totalSfntSize, dirs, block, dirSize } = parseWoff2(buf);
  const cpalIdx = dirs.findIndex((d) => d.tag === "CPAL");
  if (cpalIdx === -1) throw new Error(`p${n}: no CPAL`);
  // locate CPAL bytes in the decompressed block
  let cpalOff = 0;
  for (let i = 0; i < cpalIdx; i++) {
    const d = dirs[i];
    cpalOff += d.transformLength ?? d.origLength;
  }
  const cpal = block.subarray(cpalOff, cpalOff + dirs[cpalIdx].origLength);
  const version = cpal.readUInt16BE(0);
  const numPalettes = cpal.readUInt16BE(4);
  if (version !== 0) throw new Error(`p${n}: CPAL version ${version}`);
  if (numPalettes < 2) throw new Error(`p${n}: only ${numPalettes} palettes`);
  bakePalette(cpal, 1);
  buildWoff2(numTables, totalSfntSize, dirs, block, dst);
  return `ok ${buf.length} -> ${fs.statSync(dst).size}`;
}

const [from, to] = process.argv.slice(2).map(Number);
if (!from || !to) throw new Error("usage: node bake-night-fonts.mjs <fromPage> <toPage>");
let ok = 0, skip = 0;
const t0 = Date.now();
for (let n = from; n <= to; n++) {
  const r = processPage(n);
  if (r === "skip") skip++;
  else ok++;
  if ((n - from) % 50 === 0) console.log(`  p${n} ${r}`);
}
console.log(`done ${from}..${to}: ${ok} baked, ${skip} skipped in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
