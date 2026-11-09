const dropZone = document.getElementById('drop-zone');
const chooseButton = document.getElementById('choose-files');
const fileList = document.getElementById('file-list');
const summary = document.getElementById('summary');
let busy = false;

async function runConversion(start) {
  if (busy) return;
  busy = true;
  chooseButton.disabled = true;
  dropZone.setAttribute('aria-busy', 'true');
  try {
    const result = await start();
    if (result.error) summary.textContent = result.error;
  } catch {
    summary.textContent = 'Could not start conversion. Please choose your files again.';
  } finally {
    busy = false;
    chooseButton.disabled = false;
    dropZone.setAttribute('aria-busy', 'false');
  }
}

window.addEventListener('dragover', event => event.preventDefault());
window.addEventListener('drop', event => event.preventDefault());
dropZone.addEventListener('dragover', event => {
  event.preventDefault();
  event.dataTransfer.dropEffect = busy ? 'none' : 'copy';
});
dropZone.addEventListener('drop', event => {
  event.preventDefault();
  const files = Array.from(event.dataTransfer.files);
  if (files.length) runConversion(() => window.converter.convertDroppedFiles(files));
});
chooseButton.addEventListener('click', () => runConversion(() => window.converter.chooseFiles()));

window.converter.onStart(files => {
  fileList.replaceChildren();
  summary.textContent = `Converting ${files.length} file${files.length === 1 ? '' : 's'}…`;
  for (const file of files) {
    const row = document.createElement('li');
    row.id = `file-${file.id}`;
    const name = document.createElement('span');
    name.className = 'file-name';
    name.textContent = file.name;
    const status = document.createElement('span');
    status.className = 'file-status';
    status.textContent = 'Pending';
    row.append(name, status);
    fileList.append(row);
  }
});
window.converter.onStatus(({ id, status, outputName, reason }) => {
  const row = document.getElementById(`file-${id}`);
  if (row) row.querySelector('.file-status').textContent = outputName ? `Saved: ${outputName}` : reason ? `${status}: ${reason}` : status;
});
window.converter.onDone(({ completed, failed, skipped }) => {
  summary.textContent = `${completed} converted · ${failed} failed · ${skipped} skipped. JPGs are saved beside the originals.`;
});
