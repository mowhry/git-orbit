// Code-native artwork: integer pixels, fixed palette, no image service at runtime.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
const root = fileURLToPath(new URL('../', import.meta.url));
const definitions = [];
async function asset(path, id, width, height, body) {
  await mkdir(`${root}assets/${path.split('/')[0]}`, { recursive: true });
  await writeFile(`${root}assets/${path}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${body}</svg>\n`);
  definitions.push(`<symbol id="${id}" viewBox="0 0 ${width} ${height}">${body}</symbol>`);
}
const rect = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const polygons = [
  // Deliberately simplified geographic silhouettes, longitude / latitude.
  [[-166,68],[-139,70],[-125,58],[-110,53],[-97,50],[-83,57],[-54,54],[-62,46],[-78,40],[-82,26],[-97,18],[-108,25],[-117,32],[-127,48],[-150,58]],
  [[-96,22],[-85,23],[-78,10],[-71,8],[-77,6],[-86,15]],
  [[-80,10],[-66,10],[-52,3],[-35,-7],[-40,-20],[-52,-35],[-70,-55],[-75,-38],[-71,-17],[-81,-5]],
  [[-54,82],[-25,76],[-42,60],[-58,65]],
  [[-17,36],[10,37],[26,32],[34,30],[43,12],[51,11],[42,-2],[36,-18],[20,-35],[12,-24],[7,-4],[-8,5],[-17,15]],
  [[-10,36],[-10,44],[-1,44],[-5,49],[7,54],[9,61],[24,71],[37,69],[30,58],[43,48],[29,41],[24,36],[16,40],[12,45],[5,43],[2,38]],
  [[-10,50],[-5,59],[0,57],[2,51]],
  [[28,70],[65,76],[110,70],[165,66],[170,52],[145,45],[137,34],[115,22],[106,7],[100,4],[89,21],[76,9],[68,23],[53,27],[44,13],[35,30],[38,45]],
  [[112,-12],[139,-10],[153,-25],[145,-39],[116,-34]],
  [[47,-13],[51,-16],[47,-26],[44,-23]],
];
function inside(x,y,points) {
  let hit=false;
  for (let i=0,j=points.length-1;i<points.length;j=i++) {
    const [xi,yi]=points[i], [xj,yj]=points[j];
    if ((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) hit=!hit;
  }
  return hit;
}
function earthPixels(rotation=0) {
const rows=Array.from({length:72},()=>Array(72).fill(null));
for (let y=0;y<72;y++) for(let x=0;x<72;x++) {
  const nx=(x-35.5)/32, ny=(y-35.5)/32, d=nx*nx+ny*ny;
  if (d>1.16) continue;
  let color;
  if (d>1.05) color='#183454';
  else if (d>1) color=nx-ny<0.5?'#4b91b2':'#294466';
  else {
    const z=Math.sqrt(1-d), lat=Math.asin(-ny)*180/Math.PI;
    // Rotate the geography on a sphere, leaving the light and atmosphere stationary.
    const lon=((Math.atan2(nx,z)*180/Math.PI-25+rotation+180)%360+360)%360-180;
    const light=-0.42*nx-0.48*ny+0.77*z;
    const shade=light>0.65?3:light>0.3?2:light>0?1:0;
    const land=polygons.some(p=>inside(lon,lat,p));
    color=(land?['#24545c','#387968','#67a87b','#9bc686']:['#172b50','#22416b','#2d6391','#468faf'])[shade];
    if (lat>75 || lat < -73) color=['#3d607b','#779baa','#bed3ce','#e0e8db'][shade];
    // Narrow broken cloud bands; deterministic and deliberately sparse.
    const band=Math.sin(lon*0.085+lat*0.12)+Math.sin(lon*0.17-lat*0.09);
    if ((band>1.72 && Math.abs(lat)<65) || (lat>55 && lon>-45 && lon<0 && band>0.5))
      color=shade>2?'#dce8df':shade>1?'#9dbec2':'#456b84';
    // Sparse, ordered dither at the terminator.
    if (light<0.25 && light>0.1 && (x+2*y)%4===0) color=land?'#24545c':'#172b50';
  }
  rows[y][x]=color;
}
return rows;
}
const rows=earthPixels();
// Merge adjacent horizontal pixels for a compact Earth asset.
const paths=new Map();
for(let y=0;y<72;y++) for(let x=0;x<72;) {
  const color=rows[y][x];let end=x+1;
  while(end<72 && rows[y][end]===color) end++;
  if(color) {if(!paths.has(color)) paths.set(color,[]);paths.get(color).push(`M${x} ${y}h${end-x}v1h-${end-x}z`);}
  x=end;
}
const earth=[...paths].map(([fill,d])=>`<path fill="${fill}" d="${d.join('')}"/>`).join('');
await asset('earth/earth','earth',72,72,earth);

// An indexed PNG strip keeps 96 true sphere projections much smaller than 96 SVGs.
// Embedded in the final SVG; no external resources or runtime image dependencies.
const earthFrameCount=96, earthFrameSize=72, earthDuration=96;
const earthFrames=Array.from({length:earthFrameCount},(_,i)=>earthPixels(i*360/earthFrameCount));
const palette=new Map([[null,0]]);
for(const frame of earthFrames) for(const row of frame) for(const color of row)
  if(!palette.has(color)) palette.set(color,palette.size);
if(palette.size>256) throw new Error('Earth exceeds its indexed pixel-art palette.');
const stripWidth=earthFrameCount*earthFrameSize;
const scanlines=Buffer.alloc((stripWidth+1)*earthFrameSize);
for(let y=0;y<earthFrameSize;y++) for(let f=0;f<earthFrameCount;f++) for(let x=0;x<earthFrameSize;x++)
  scanlines[y*(stripWidth+1)+1+f*earthFrameSize+x]=palette.get(earthFrames[f][y][x]);
function crc32(bytes) {
  let crc=0xffffffff;
  for(const byte of bytes) {
    crc^=byte;
    for(let i=0;i<8;i++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data) {
  const name=Buffer.from(type), length=Buffer.alloc(4), crc=Buffer.alloc(4);
  length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));
  return Buffer.concat([length,name,data,crc]);
}
const header=Buffer.alloc(13);
header.writeUInt32BE(stripWidth,0);header.writeUInt32BE(earthFrameSize,4);
header[8]=8;header[9]=3; // 8-bit indexed color, no interlace.
const paletteBytes=Buffer.from([...palette.keys()].flatMap(color=>color
  ? [1,3,5].map(offset=>parseInt(color.slice(offset,offset+2),16)) : [0,0,0]));
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),
  chunk('PLTE',paletteBytes),chunk('tRNS',Buffer.from([0])),
  chunk('IDAT',deflateSync(scanlines,{level:9})),chunk('IEND',Buffer.alloc(0))]);
await writeFile(`${root}assets/earth/rotation.png`,png);
const earthRotation={dataUri:`data:image/png;base64,${png.toString('base64')}`,
  frameCount:earthFrameCount,frameSize:earthFrameSize,duration:earthDuration};
for(let tier=1;tier<=4;tier++) {
  const outline='#101e35', metal='#aab7cf', bright='#e1e6eb', shadow='#66738e';
  let s='';
  const r=(x,y,w,h,c)=>{s+=rect(x,y,w,h,c);};
  r(13,7,8,11,outline); r(14,8,6,8,metal); r(14,8,6,2,bright);
  r(14,10,2,6,'#c9d3df'); r(19,10,1,7,shadow); r(15,16,5,1,shadow);
  r(10,11,4,2,shadow);r(20,11,4,2,shadow);
  const panelWidth=tier===1?7:9, left=tier===1?3:1, right=23;
  const top=tier>=3?7:9, height=tier>=3?10:7;
  for(const x of [left,right]) {
    r(x,top,panelWidth,height,outline);r(x+1,top+1,panelWidth-2,height-2,'#2459a0');
    r(x+1,top+1,panelWidth-2,1,'#6da6cb');
    for(let a=x+3;a<x+panelWidth-1;a+=3) r(a,top+1,1,height-2,'#173a6c');
    r(x+1,top+4,panelWidth-2,1,'#173a6c');
  }
  r(16,3,1,5,shadow);r(15,3,3,1,bright);r(16,2,1,1,'#ffd477');
  r(16,12,2,3,shadow);r(16,12,2,1,outline);
  if(tier>=2) { r(20,7,2,3,'#d5ad6e');r(14,18,5,1,outline);r(15,18,3,1,shadow); }
  if(tier>=3) { r(20,3,1,5,shadow);r(19,2,4,1,bright);r(20,3,3,1,metal);r(21,4,1,1,shadow);r(15,19,3,2,outline);r(16,19,1,1,'#62c7d0'); }
  if(tier===4) {r(0,5,11,2,outline);r(1,5,9,1,'#6e76bb');r(22,5,11,2,outline);r(23,5,9,1,'#6e76bb');r(14,10,1,6,'#e5b96f');r(18,17,2,1,'#e5b96f');}
  await asset(`satellites/tier-${tier}`,`satellite-tier-${tier}`,34,24,s);
}
await asset('effects/star','star',7,7,rect(3,0,1,7,'currentColor')+rect(0,3,7,1,'currentColor')+rect(2,2,3,3,'currentColor'));
await asset('effects/signal','signal',10,10,'<path d="M1 1h2v2h2v2h2v2h2v2H8V8H6V6H4V4H2V2H1z" fill="currentColor"/>');
await writeFile(`${root}src/renderer/assets.generated.ts`, `// Generated by scripts/build-assets.mjs; source artwork lives in assets/.\nexport const ASSETS = ${JSON.stringify(definitions.join(''))};\nexport const EARTH_ROTATION = ${JSON.stringify(earthRotation)};\n`);
console.log(`Wrote Earth, ${earthFrameCount} rotation frames (${png.length} bytes), four CubeSat tiers and effects.`);
