import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { EARTH_ROTATION } from '../src/renderer/assets.generated.js';
import { earth, earthMotion } from '../src/renderer/earth.js';

test('the rotation strip has 96 distinct, nonempty globe frames with a fixed silhouette', () => {
  const { dataUri, frameCount, frameSize } = EARTH_ROTATION;
  const png = Buffer.from(dataUri.split(',')[1]!, 'base64');
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), frameCount * frameSize);
  assert.equal(png.readUInt32BE(20), frameSize);
  assert.equal(png[25], 3, 'indexed palette');
  let offset = 8;
  const data: Buffer[] = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') data.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const pixels = inflateSync(Buffer.concat(data));
  const rowWidth = frameCount * frameSize + 1;
  const hashes = new Set<string>();
  let firstMask: Buffer | undefined;
  for (let frame = 0; frame < frameCount; frame++) {
    const image = Buffer.alloc(frameSize * frameSize);
    for (let y = 0; y < frameSize; y++) {
      assert.equal(pixels[y * rowWidth], 0, 'unfiltered pixel scanline');
      pixels.copy(image, y * frameSize, y * rowWidth + 1 + frame * frameSize, y * rowWidth + 1 + (frame + 1) * frameSize);
    }
    const mask = Buffer.from(image.map(value => value > 0 ? 1 : 0));
    assert.ok(mask.reduce((sum, value) => sum + value, 0) > 3000, 'no blank globe frame');
    if (firstMask) assert.ok(firstMask.equals(mask), 'Earth stays round and stationary');
    firstMask = mask;
    hashes.add(createHash('sha256').update(image).digest('hex'));
  }
  assert.equal(hashes.size, frameCount);
});

test('Earth uses discrete pixel frames with a static fallback and no external resources', () => {
  assert.match(earthMotion(), /96s steps\(96,end\) infinite/);
  assert.match(earth(true), /overflow="hidden"/);
  assert.match(earth(true), /href="data:image\/png;base64,/);
  assert.doesNotMatch(earth(false), /<image|earth-turn/);
  assert.match(earth(false), /href="#earth"/);
});
