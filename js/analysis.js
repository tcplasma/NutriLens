// ═══════════════════════════════════════════════
//  MAIN ANALYSIS PIPELINE (English messages)
// ═══════════════════════════════════════════════
async function runAnalysis() {
    if (!currentImageData) return;
    const K = parseInt(document.getElementById('k-slider').value);
    const sens = parseInt(document.getElementById('sens-slider').value);

    document.getElementById('btn-analyze').disabled = true;
    document.getElementById('progress-wrap').style.display = 'block';
    document.getElementById('results-section').style.display = 'none';

    await setProgress(5, 'Detecting white plate…');
    const { center, radius, detected } = detectPlate(currentImageData, sens);

    await setProgress(20, 'Building food mask…');
    const { foodMask, foodPixels } = createFoodMask(currentImageData, center, radius);

    if (foodPixels.length < 10) {
        alert('Unable to detect enough food area. Try adjusting sensitivity or use a different image.');
        document.getElementById('btn-analyze').disabled = false;
        document.getElementById('progress-wrap').style.display = 'none';
        return;
    }

    await setProgress(40, 'Sampling pixel features…');
    const samples = samplePixels(foodPixels, 4000);

    await setProgress(60, `Running Mini-batch K-Means (k=${K})…`);
    const { labels, centroids, silhouette } = await kMeans(samples, K);

    await setProgress(80, 'Computing area statistics…');
    const { allLabels, areas } = classifyAllPixels(foodMask, currentImageData, centroids);

    await setProgress(92, 'Rendering visualizations…');
    drawMaskCanvas(foodMask, currentImageData.width, currentImageData.height);
    drawClusteredCanvas(foodMask, allLabels, centroids, currentImageData.width, currentImageData.height);
    drawPlateOverlay(center, radius);

    await setProgress(100, 'Done!');
    await sleep(300);

    showResults(K, silhouette, foodPixels.length, centroids, areas, allLabels);

    document.getElementById('progress-wrap').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
    document.getElementById('btn-analyze').disabled = false;
}
