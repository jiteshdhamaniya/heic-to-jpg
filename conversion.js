const fs = require('node:fs/promises');
const path = require('node:path');
const heicConvert = require('heic-convert');

async function convertFile(inputPath, convert = heicConvert) {
  if (typeof inputPath !== 'string' || !path.isAbsolute(inputPath)) {
    throw new Error('Choose a file from your computer.');
  }
  if (path.extname(inputPath).toLowerCase() !== '.heic') return { status: 'Skipped: not a HEIC file' };
  const input = await fs.open(inputPath, 'r');
  let buffer;
  try {
    if (!(await input.stat()).isFile()) throw new Error('The selected item is not a regular file.');
    buffer = await input.readFile();
  } finally {
    await input.close();
  }
  const jpeg = await convert({ buffer, format: 'JPEG', quality: 1 });
  const stem = inputPath.slice(0, -path.extname(inputPath).length);
  for (let suffix = 0; suffix < 10000; suffix++) {
    const outputPath = `${stem}${suffix ? ` (${suffix})` : ''}.jpg`;
    let output;
    try {
      // Exclusive creation protects existing JPGs and symlinks, even across batches.
      output = await fs.open(outputPath, 'wx');
    } catch (error) {
      if (error.code === 'EEXIST') continue;
      throw error;
    }
    try {
      await output.writeFile(jpeg);
    } catch (error) {
      await output.close();
      await fs.unlink(outputPath).catch(() => {});
      throw error;
    }
    await output.close();
    return { status: 'Completed', outputName: path.basename(outputPath) };
  }
  throw new Error('Too many JPGs with this filename already exist.');
}

module.exports = { convertFile };
