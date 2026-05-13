const fs = require('fs');
const zlib = require('zlib');
const files = ['client/src/pages/SubmitArtwork.tsx','client/src/components/StripeConnectPanel.tsx','server/routes.ts','server/storage.ts','shared/schema.ts','replit.md'];
function crc32(buf){let c=~0; for(const b of buf){c^=b; for(let k=0;k<8;k++) c=(c>>>1)^(0xedb88320&-(c&1));} return (~c)>>>0;}
function u16(n){const b=Buffer.alloc(2); b.writeUInt16LE(n); return b;}
function u32(n){const b=Buffer.alloc(4); b.writeUInt32LE(n>>>0); return b;}
const local=[];
const central=[];
let offset=0;
for(const file of files){
  const data=fs.readFileSync(file);
  const nameBuf=Buffer.from(file.replace(/\\/g,'/'));
  const comp=zlib.deflateRawSync(data);
  const crc=crc32(data);
  const lf=Buffer.concat([
    Buffer.from([0x50,0x4b,0x03,0x04]),
    u16(20),u16(0),u16(8),u16(0),u16(0),u16(0),
    u32(crc),u32(comp.length),u32(data.length),
    u16(nameBuf.length),u16(0),nameBuf,comp
  ]);
  local.push(lf);
  const ch=Buffer.concat([
    Buffer.from([0x50,0x4b,0x01,0x02]),
    u16(20),u16(20),u16(0),u16(8),u16(0),u16(0),u16(0),
    u32(crc),u32(comp.length),u32(data.length),
    u16(nameBuf.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameBuf
  ]);
  central.push(ch);
  offset += lf.length;
}
const centralBuf = Buffer.concat(central);
const end = Buffer.concat([
  Buffer.from([0x50,0x4b,0x05,0x06]),
  u16(0),u16(0),u16(files.length),u16(files.length),u32(centralBuf.length),u32(offset),u16(0)
]);
fs.writeFileSync('brushbids-source.zip', Buffer.concat([...local, centralBuf, end]));
console.log('created brushbids-source.zip');