import zlib from "node:zlib";
import fs from "node:fs";

const F = process.argv[2] ?? "public/data/quran/v4/fonts/p2.woff2";
const buf = fs.readFileSync(F);
if (buf.toString("ascii", 0, 4) !== "wOF2") throw new Error("not woff2");
const u16 = (o) => buf.readUInt16BE(o);
const u32 = (o) => buf.readUInt32BE(o);

const flavor = u32(4);
const numTables = u16(12);
const totalSfntSize = u32(16);
const totalCompressedSize = u32(20);
const metaOffset = u32(28);
const metaLength = u32(32);
const privOffset = u32(40);
const privLength = u32(44);

// --- UIntBase128 ---
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

const KNOWN = ["cmap","head","hhea","hmtx","maxp","name","OS/2","post","cvt ","fpgm","glyf","loca","prep","CFF ","VORG","EBDT","EBLC","gasp","hdmx","kern","LTSH","PCLT","VDMX","vhea","vmtx","BASE","GDEF","GPOS","GSUB","EBSC","JSTF","MATH","CBDT","CBLC","COLR","CPAL","SVG ","sbix","acnt","avar","bdat","bloc","bsln","cvar","fdsc","feat","fmtx","fvar","gvar","hsty","just","lcar","mort","morx","opbd","prop","trak","Zapf","Silf","Glat","Gloc","Feat","Sill"];

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
  let transformLength = null;
  const isGlyfTransform = (tag === "glyf" || tag === "loca") && transformVersion !== 3;
  if (transformVersion !== 0 || isGlyfTransform) {
    const t2 = readBase128(buf, off);
    off = t2.next;
    transformLength = t2.value;
  }
  dirs.push({ tag, flags, origLength, transformLength, transformVersion });
}

console.log("dir size:", off - 48, "totalCompressedSize:", totalCompressedSize, "numTables:", numTables);
console.log("dirs:", dirs.map((d) => `${d.tag}(v${d.transformVersion}, ${d.origLength}${d.transformLength ? "->" + d.transformLength : ""})`).join(" "));

// decompress the single brotli stream
const dataStart = off;
const dataEnd = dataStart + totalCompressedSize;
let block;
try {
  block = zlib.brotliDecompressSync(buf.subarray(dataStart, dataEnd));
} catch (e) {
  block = zlib.brotliDecompressSync(buf.subarray(dataStart));
}
const expected = dirs.reduce((s, d) => s + (d.transformLength ?? d.origLength), 0);
console.log("decompressed block len:", block.length, "expected:", expected);

const tableData = {};
let c = 0;
for (const d of dirs) {
  const len = d.transformLength ?? d.origLength;
  tableData[d.tag] = block.subarray(c, c + len);
  c += len;
}

// --- parse CPAL ---
const cp = tableData["CPAL"];
const u16cp = (o) => cp.readUInt16BE(o);
const u32cp = (o) => cp.readUInt32BE(o);
const version = u16cp(0);
const numPaletteEntries = u16cp(2);
const numPalettes = u16cp(4);
const numColorRecords = u16cp(6);
const colorRecordsArrayOffset = u32cp(8);
const colorRecordIndicesOffset = 12;
const colorIndex = [];
for (let p = 0; p < numPalettes; p++) colorIndex.push(u16cp(colorRecordIndicesOffset + p * 2));
const hex = (b) =>
  "#" +
  b.readUInt8(0).toString(16).padStart(2, "0") +
  b.readUInt8(1).toString(16).padStart(2, "0") +
  b.readUInt8(2).toString(16).padStart(2, "0") +
  b.readUInt8(3).toString(16).padStart(2, "0");
console.log("CPAL:", { version, numPaletteEntries, numPalettes, numColorRecords, colorRecordsArrayOffset, colorIndex });
for (let p = 0; p < numPalettes; p++) {
  const start = colorRecordsArrayOffset + colorIndex[p] * 4;
  const colors = [];
  for (let e = 0; e < numPaletteEntries; e++) colors.push(hex(cp.subarray(start + e * 4)));
  console.log("palette", p, ":", colors.join(" "));
}
