# Changelog

## 1.1.0 — 2026-11-09

- Prepare the project for public source distribution with MIT licensing and build instructions.
- Update Electron and packaging dependencies; remove unused direct dependencies.
- Use a sandboxed renderer, isolated preload bridge, restricted IPC, and a local-only content policy.
- Update drag-and-drop to Electron's supported file-path API and add a file picker.
- Preserve existing JPEGs with exclusive file creation and numbered output filenames.
- Serialize batches and show per-file failures without misleading completion messages.
- Add synthetic conversion tests and document compatibility and metadata limitations.
