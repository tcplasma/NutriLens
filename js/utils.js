// ═══════════════════════════════════════════════
//  PROGRESS HELPER & UTILITIES
// ═══════════════════════════════════════════════
function setProgress(pct, msg) {
    document.getElementById('progress-bar').style.width = pct + '%';
    document.getElementById('progress-step').textContent = msg;
    return sleep(10);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
