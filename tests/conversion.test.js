const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { convertFile } = require('../conversion');

async function fixture(t, name = 'photo.heic') {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'heic-to-jpg-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const input = path.join(directory, name);
  await fs.copyFile(path.join(__dirname, 'fixtures/sample.heic'), input);
  return { directory, input };
}
const fakeJPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const encode = async () => fakeJPEG;

test('converts a real HEIC to JPEG without changing its source', async t => {
  const { directory, input } = await fixture(t, 'photo.HEIC');
  const original = await fs.readFile(input);
  assert.deepEqual(await convertFile(input), { status: 'Completed', outputName: 'photo.jpg' });
  const output = await fs.readFile(path.join(directory, 'photo.jpg'));
  assert.deepEqual([...output.subarray(0, 2)], [0xff, 0xd8]);
  assert.deepEqual([...output.subarray(-2)], [0xff, 0xd9]);
  assert.ok(output.length > 100);
  assert.deepEqual(await fs.readFile(input), original);
});

test('keeps existing JPGs and selects the next unused name', async t => {
  const { directory, input } = await fixture(t);
  await fs.writeFile(path.join(directory, 'photo.jpg'), 'existing original');
  await fs.writeFile(path.join(directory, 'photo (1).jpg'), 'existing second');
  const result = await convertFile(input, encode);
  assert.equal(result.outputName, 'photo (2).jpg');
  assert.equal(await fs.readFile(path.join(directory, 'photo.jpg'), 'utf8'), 'existing original');
  assert.equal(await fs.readFile(path.join(directory, 'photo (1).jpg'), 'utf8'), 'existing second');
});

test('concurrent conversions cannot overwrite each other', async t => {
  const { input } = await fixture(t);
  const results = await Promise.all([convertFile(input, encode), convertFile(input, encode)]);
  assert.deepEqual(new Set(results.map(result => result.outputName)), new Set(['photo.jpg', 'photo (1).jpg']));
});

test('does not follow or overwrite an existing output symlink', async t => {
  const { directory, input } = await fixture(t);
  const protectedFile = path.join(directory, 'keep.txt');
  await fs.writeFile(protectedFile, 'keep me');
  await fs.symlink(protectedFile, path.join(directory, 'photo.jpg'));
  assert.equal((await convertFile(input, encode)).outputName, 'photo (1).jpg');
  assert.equal(await fs.readFile(protectedFile, 'utf8'), 'keep me');
});

test('invalid HEIC reports failure and creates no output', async t => {
  const { directory, input } = await fixture(t);
  await fs.writeFile(input, 'not an image');
  await assert.rejects(convertFile(input));
  assert.deepEqual(await fs.readdir(directory), ['photo.heic']);
});

test('skips other formats without invoking the encoder', async t => {
  const { input } = await fixture(t, 'picture.png');
  const result = await convertFile(input, () => { throw new Error('Must not encode'); });
  assert.equal(result.status, 'Skipped: not a HEIC file');
});

test('rejects directories and non-absolute input paths', async t => {
  const { directory } = await fixture(t);
  const folder = path.join(directory, 'folder.heic');
  await fs.mkdir(folder);
  await assert.rejects(convertFile(folder, encode), /regular file/);
  await assert.rejects(convertFile('relative.heic', encode), /Choose a file/);
  await assert.rejects(convertFile(null, encode), /Choose a file/);
});

test('encoder failures do not leave a JPG behind', async t => {
  const { directory, input } = await fixture(t);
  await assert.rejects(convertFile(input, async () => { throw new Error('Encoder failed'); }), /Encoder failed/);
  assert.deepEqual(await fs.readdir(directory), ['photo.heic']);
});
