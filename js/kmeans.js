// ═══════════════════════════════════════════════
//  MINI-BATCH K-MEANS CLUSTERING
// ═══════════════════════════════════════════════

/**
 * Sample up to maxN pixels from the array (deterministic step sampling).
 */
function samplePixels(pixels, maxN) {
    if (pixels.length <= maxN) return pixels;
    const step = Math.floor(pixels.length / maxN);
    return pixels.filter((_, i) => i % step === 0).slice(0, maxN);
}

/**
 * Mini-batch K-Means clustering.
 *
 * Instead of updating centroids using ALL data points each iteration,
 * this algorithm randomly selects a mini-batch of points per iteration
 * and updates centroids incrementally using a per-centroid counter.
 *
 * @param {Array} pixels - Array of {r, g, b} pixel objects
 * @param {number} K - Number of clusters
 * @param {number} maxIter - Maximum iterations (default 30)
 * @param {number} batchSize - Mini-batch size (default 256)
 * @returns {Object} { labels, centroids, silhouette }
 */
async function kMeans(pixels, K, maxIter = 30, batchSize = 256) {
    const pts = pixels.map(p => [p.r, p.g, p.b]);
    const centroids = initCentroidsKpp(pts, K);

    // Per-centroid update counters (for incremental learning rate)
    const counts = new Array(K).fill(0);

    let labels = new Array(pts.length).fill(0);
    let iter = 0;

    while (iter < maxIter) {
        // 1. Select a random mini-batch
        const batchIndices = selectMiniBatch(pts.length, batchSize);

        // 2. Assign each mini-batch point to nearest centroid
        let changed = false;
        for (const idx of batchIndices) {
            let best = 0, bestD = Infinity;
            for (let k = 0; k < K; k++) {
                const d = dist2(pts[idx], centroids[k]);
                if (d < bestD) { bestD = d; best = k; }
            }
            if (labels[idx] !== best) { labels[idx] = best; changed = true; }
        }

        // 3. Update centroids incrementally using mini-batch
        for (const idx of batchIndices) {
            const k = labels[idx];
            counts[k]++;
            // Learning rate = 1 / counts[k] — decreases as more points are seen
            const lr = 1 / counts[k];
            centroids[k] = [
                Math.round(centroids[k][0] + lr * (pts[idx][0] - centroids[k][0])),
                Math.round(centroids[k][1] + lr * (pts[idx][1] - centroids[k][1])),
                Math.round(centroids[k][2] + lr * (pts[idx][2] - centroids[k][2]))
            ];
        }

        iter++;
        if (iter % 5 === 0) await sleep(0); // yield to UI

        // Early stop if no assignments changed in this mini-batch
        if (!changed && iter > 3) break;
    }

    // Final pass: assign ALL points to nearest centroid
    for (let i = 0; i < pts.length; i++) {
        let best = 0, bestD = Infinity;
        for (let k = 0; k < K; k++) {
            const d = dist2(pts[i], centroids[k]);
            if (d < bestD) { bestD = d; best = k; }
        }
        labels[i] = best;
    }

    // Silhouette (sample-based, fast)
    const silhouette = computeSilhouette(pts, labels, K);
    return { labels, centroids, silhouette };
}

/**
 * Select random indices for a mini-batch.
 */
function selectMiniBatch(totalLength, batchSize) {
    const size = Math.min(batchSize, totalLength);
    const indices = new Set();
    while (indices.size < size) {
        indices.add(Math.floor(Math.random() * totalLength));
    }
    return Array.from(indices);
}

/**
 * K-means++ initialization.
 */
function initCentroidsKpp(pts, K) {
    const idx = [Math.floor(Math.random() * pts.length)];
    const chosen = [pts[idx[0]]];
    while (chosen.length < K) {
        const dists = pts.map(p => Math.min(...chosen.map(c => dist2(p, c))));
        const sum = dists.reduce((a, b) => a + b, 0);
        let r = Math.random() * sum, cumul = 0;
        for (let i = 0; i < pts.length; i++) {
            cumul += dists[i];
            if (cumul >= r) { chosen.push(pts[i]); break; }
        }
    }
    return chosen;
}

/**
 * Squared Euclidean distance between two RGB points.
 */
function dist2(a, b) {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

/**
 * Sample-based silhouette coefficient (fast approximation).
 */
function computeSilhouette(pts, labels, K) {
    const sample = pts.filter((_, i) => i % 10 === 0);
    const slabels = labels.filter((_, i) => i % 10 === 0);
    if (sample.length < 2 * K) return 0;

    let total = 0;
    for (let i = 0; i < sample.length; i++) {
        const myK = slabels[i];
        const same = sample.filter((_, j) => slabels[j] === myK && j !== i);
        if (same.length === 0) continue;
        const a = same.reduce((s, p) => s + Math.sqrt(dist2(sample[i], p)), 0) / same.length;
        let b = Infinity;
        for (let k = 0; k < K; k++) {
            if (k === myK) continue;
            const other = sample.filter((_, j) => slabels[j] === k);
            if (other.length === 0) continue;
            const d = other.reduce((s, p) => s + Math.sqrt(dist2(sample[i], p)), 0) / other.length;
            if (d < b) b = d;
        }
        total += (b - a) / Math.max(a, b);
    }
    return total / sample.length;
}

/**
 * Classify ALL food pixels to nearest centroid.
 */
function classifyAllPixels(foodMask, imgData, centroids) {
    const { width: W, height: H, data } = imgData;
    const allLabels = new Int8Array(W * H).fill(-1);
    const areas = new Array(centroids.length).fill(0);

    for (let i = 0; i < foodMask.length; i++) {
        if (!foodMask[i]) continue;
        const pi = i * 4;
        const p = [data[pi], data[pi + 1], data[pi + 2]];
        let best = 0, bestD = Infinity;
        for (let k = 0; k < centroids.length; k++) {
            const d = dist2(p, centroids[k]);
            if (d < bestD) { bestD = d; best = k; }
        }
        allLabels[i] = best;
        areas[best]++;
    }
    return { allLabels, areas };
}
