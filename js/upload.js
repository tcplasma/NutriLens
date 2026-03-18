// ═══════════════════════════════════════════════
//  UPLOAD / DRAG & DROP
// ═══════════════════════════════════════════════
(function () {
    const zone = document.getElementById('upload-zone');
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault(); zone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) loadFile(file);
    });
    document.getElementById('file-input').addEventListener('change', e => {
        if (e.target.files[0]) loadFile(e.target.files[0]);
    });
})();

function loadFile(file) {
    const reader = new FileReader();
    reader.onload = ev => loadImageSrc(ev.target.result);
    reader.readAsDataURL(file);
}
