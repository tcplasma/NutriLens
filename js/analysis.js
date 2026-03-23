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

    await setProgress(15, 'Fitting ellipse (perspective warp)…');
    // We use a preliminary circular mask to gather white pixels for the ellipse fit
    const srcMaskRes = createFoodMask(currentImageData, center, radius);
    let { foodMask, foodPixels } = srcMaskRes;
    
    // Fit an ellipse to the white pixels found by the initial circular detection
    // foodPixels only contains "non-white", we need "white" to fit the plate
    const whitePixels = [];
    const sx = center[0], sy = center[1], r2 = radius * radius;
    for (let y = 0; y < currentImageData.height; y++) {
        for (let x = 0; x < currentImageData.width; x++) {
            if ((x-sx)*(x-sx) + (y-sy)*(y-sy) > r2) continue;
            const i = (y * currentImageData.width + x) * 4;
            const enablePlateColor = document.getElementById('enable-plate-color').checked;
            let isPlate = false;
            if (enablePlateColor) {
                const selectedPlateColor = document.getElementById('plate-color-picker').value;
                const rPlate = parseInt(selectedPlateColor.slice(1, 3), 16);
                const gPlate = parseInt(selectedPlateColor.slice(3, 5), 16);
                const bPlate = parseInt(selectedPlateColor.slice(5, 7), 16);
                const dist = Math.sqrt((currentImageData.data[i] - rPlate)**2 + (currentImageData.data[i+1] - gPlate)**2 + (currentImageData.data[i+2] - bPlate)**2);
                const tolerance = [80, 70, 60, 50, 40][sens - 1];
                isPlate = dist < tolerance;
            } else {
                const { s, v } = rgbToHsv(currentImageData.data[i], currentImageData.data[i+1], currentImageData.data[i+2]);
                isPlate = s <= 0.12 && v >= 0.82; 
            }
            
            if (isPlate) whitePixels.push({x, y});
        }
    }

    let ellipse = fitEllipse(whitePixels);
    let analysisImageData = currentImageData;

    // If we have a valid ellipse and it's noticeably angled (eccentricity > 1.1)
    if (ellipse && ellipse.a / ellipse.b > 1.1 && ellipse.a / ellipse.b < 3.0) {
        await setProgress(20, 'Applying perspective warp…');
        const warpedCanvas = warpEllipseToCircle(currentImageData, ellipse);
        const tmpCtx = warpedCanvas.getContext('2d');
        analysisImageData = tmpCtx.getImageData(0, 0, warpedCanvas.width, warpedCanvas.height);
        
        // After warping, the plate is a perfect circle centered in the new canvas
        const newRadius = Math.min(warpedCanvas.width, warpedCanvas.height) / 2;
        const newCenter = [warpedCanvas.width / 2, warpedCanvas.height / 2];
        const res = createFoodMask(analysisImageData, newCenter, newRadius);
        foodMask = res.foodMask;
        foodPixels = res.foodPixels;
    } else {
        await setProgress(20, 'Building food mask…');
        // No steep perspective or fit failed, use circular mask directly
        ellipse = null;
    }

    if (foodPixels.length < 10) {
        alert('Unable to detect enough food area. Try adjusting sensitivity or use a different image.');
        document.getElementById('btn-analyze').disabled = false;
        document.getElementById('progress-wrap').style.display = 'none';
        return;
    }

    await setProgress(35, 'Equalizing lighting (V-channel)…');
    const { equalized, lut } = equalizeV(foodPixels);

    await setProgress(45, 'Sampling pixel features…');
    const samples = samplePixels(equalized, 4000);

    await setProgress(60, `Running Mini-batch K-Means (k=${K})…`);
    const { labels, centroids, labCentroids, silhouette } = await kMeans(samples, K);

    await setProgress(80, 'Computing area statistics…');
    const { allLabels, areas } = classifyAllPixels(foodMask, analysisImageData, labCentroids, lut);

    await setProgress(92, 'Rendering visualizations…');
    drawMaskCanvas(foodMask, analysisImageData.width, analysisImageData.height);
    drawClusteredCanvas(foodMask, allLabels, centroids, analysisImageData.width, analysisImageData.height);
    drawPlateOverlay(center, Math.round(Math.max(ellipse?.a || radius, ellipse?.b || radius)), ellipse);

    await setProgress(100, 'Done!');
    await sleep(300);

    showResults(K, silhouette, foodPixels.length, centroids, areas, allLabels);

    document.getElementById('progress-wrap').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
    document.getElementById('btn-analyze').disabled = false;
}
