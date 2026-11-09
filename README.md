# HEIC to JPG

A small macOS desktop app for converting HEIC images to JPG files on your own computer. Drop a batch of images onto the window or use **Choose HEIC files…**. There are no uploads, accounts, API keys, or cloud conversion services.

**Build it yourself:** the instructions below produce a local app without a paid Apple Developer membership. This project is open source under the MIT license; dependencies retain their own licenses.

## What it does

- Converts `.heic` files, including uppercase `.HEIC`, to JPEG at the converter's highest quality setting.
- Saves each JPG beside its HEIC source. Original HEIC files remain unchanged.
- Preserves existing files: if `photo.jpg` exists, saves `photo (1).jpg`, then `photo (2).jpg`, and so on.
- Shows conversion results for each file, including failures and skipped formats.
- Processes one batch at a time, up to 1,000 files per batch.

This is an Electron app, using `heic-convert` for decoding and JPEG encoding. Images stay local. The renderer is sandboxed, Node integration is disabled, and the app blocks remote navigation and network requests from its web contents.

## Build from source

### 1. Install the tools

Use **macOS 13 or later**, **Node.js 24 LTS with npm**, and Git. Install Node from [nodejs.org](https://nodejs.org/en/download). Check your versions in Terminal:

```sh
node --version
npm --version
```

The Node version should start with `v24.`. If Git or Apple's developer tools are missing, run the following and finish the installer:

```sh
xcode-select --install
```

### 2. Get the code and dependencies

In Terminal, go to the folder where you want to keep the source, then run:

```sh
git clone https://github.com/jiteshdhamaniya/heic-to-jpg.git
cd heic-to-jpg
npm ci
```

`npm ci` installs the versions recorded in `package-lock.json`, including Electron. Internet access is required for installation, the first development launch, and the first packaging run; conversion itself runs locally. You can inspect `index.js`, `preload.js`, `renderer.js`, and `conversion.js` before running the app.

### 3. Check and run

```sh
npm run check
npm test
npm start
```

Tests use a small generated HEIC image, not user photos. They check real conversion, unchanged originals, duplicate output names, concurrent conversions, symlink protection, invalid files, and failed conversion cleanup.

### 4. Build a macOS app

Quit the development app, then run:

```sh
npm run build
open dist
```

The output folder contains a DMG and the packaged app. Open the DMG and drag **HEIC to JPG.app** into **Applications**. Quit any older copy before replacing it.

The default build targets your Mac's architecture. For a specific target:

```sh
npm run build -- --arm64
# Or for an Intel Mac:
npm run build -- --x64
```

To package only the `.app`, without creating a DMG:

```sh
npm run build:dir
```

No signing account or certificate is required. Builds are not Developer ID signed or notarized by Apple; a downloaded or shared copy may trigger a macOS warning. Building locally does not make the app Apple-notarized. See [Apple's explanation](https://support.apple.com/102445) if macOS blocks a copy you downloaded.

## Using it

1. Launch **HEIC to JPG**.
2. Drop files onto the drop area, or click **Choose HEIC files…**.
3. Wait for the batch to finish. The list shows the output filename or a failure message.
4. Find the JPGs in the same folders as the original HEIC files.

The app needs permission to read those files and write into their folders. It waits for an active batch to finish before closing. An existing JPG is never replaced, even when a file is converted again.

## Limitations

- This is a still-image HEIC-to-JPEG converter. It does not export Live Photo video or all images from a multi-image container.
- JPEG is lossy. Do not rely on this conversion to preserve EXIF metadata, HDR information, or the source's full color representation; keep your HEIC originals.
- Large images can take time and memory. Work in smaller batches if needed.
- macOS is the documented build target. The source uses Electron, but Windows and Linux packages have not been validated.
- Intel packaging can be requested as shown above; runtime testing was performed on Apple Silicon running macOS 26.1.

## Update your copy

From your existing checkout, with the app closed:

```sh
git pull --ff-only
npm ci
npm run check
npm test
npm run build
```

Then replace your installed app with the new build. Resolve any local Git changes before updating; do not discard your own edits.

## Troubleshooting

- **Node engine warning:** use Node 24 LTS rather than an older or prerelease Node installation.
- **Electron download fails:** check your internet connection or proxy, then retry `npm ci`.
- **File conversion fails:** confirm the input is a readable HEIC image and its folder is writable. A renamed or damaged file may not be a valid HEIC image.
- **A JPG already exists:** the app intentionally creates a numbered filename instead of overwriting it.
- **A dependency audit reports an issue:** include the package name and advisory link in your report. Run `npm audit` to inspect the current lockfile; do not use `npm audit fix --force` without reviewing its version changes.

## Development and licenses

The 1.1.0 source release updates Electron, isolates the renderer, repairs the preload bridge, and prevents existing JPGs from being overwritten. The build uses a version-scoped `minimatch` override for patched packaging dependencies; review them when updating electron-builder.

Issues and pull requests are welcome. Include macOS and Node versions, reproduction steps, and a synthetic example if possible. Do not upload private photographs or credentials. Run `npm run check`, `npm test`, and `npm run build:dir` before proposing code changes.

See [LICENSE](LICENSE) for the app's MIT license and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for dependency notices.
