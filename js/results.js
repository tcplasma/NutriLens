// ═══════════════════════════════════════════════
//  SHOW RESULTS (English labels)
// ═══════════════════════════════════════════════
function showResults(K, silhouette, foodPixCount, centroids, areas, allLabels) {
    document.getElementById('res-k').textContent = K;
    document.getElementById('res-silhouette').textContent = silhouette.toFixed(3);
    const pixK = foodPixCount > 9999
        ? (foodPixCount / 1000).toFixed(1) + 'k'
        : foodPixCount.toString();
    document.getElementById('res-pixels').textContent = pixK;

    const total = areas.reduce((a, b) => a + b, 0);
    const wrap = document.getElementById('clusters-wrap');
    wrap.innerHTML = '';

    // Sort by area descending
    const order = areas.map((a, i) => ({ a, i })).sort((x, y) => y.a - x.a);

    order.forEach(({ a, i }) => {
        const c = centroids[i];
        const pct = total > 0 ? (a / total * 100).toFixed(1) : '0.0';
        const hex = rgbToHex(c[0], c[1], c[2]);
        const textColor = luminance(c[0], c[1], c[2]) > 0.4 ? '#111' : '#fff';
        const vizColor = CLUSTER_COLORS_VIZ[i % CLUSTER_COLORS_VIZ.length];
        const vizHex = rgbToHex(...vizColor);
        const label = guessColorLabel(c[0], c[1], c[2]);

        const row = document.createElement('div');
        row.className = 'cluster-row';
        row.innerHTML = `
      <div class="cluster-swatch" style="background:${hex}"></div>
      <div class="cluster-info">
        <div class="cluster-name" style="color:${vizHex}">${label}</div>
        <div class="cluster-rgb">RGB(${c[0]}, ${c[1]}, ${c[2]}) &nbsp; ${hex}</div>
        <div class="cluster-bar-wrap">
          <div class="cluster-bar" style="width:${pct}%;background:${vizHex}"></div>
        </div>
      </div>
      <div class="cluster-pct">${pct}%</div>
    `;
        wrap.appendChild(row);
    });

    // Nutrition hints
    buildNutritionHints(centroids, areas);
}

function buildNutritionHints(centroids, areas) {
    const total = areas.reduce((a, b) => a + b, 0);
    const grid = document.getElementById('nutrition-grid');
    grid.innerHTML = '';

    const hints = centroids.map((c, i) => ({
        pct: areas[i] / total,
        hint: colorToNutrition(c[0], c[1], c[2])
    }));

    hints.sort((a, b) => b.pct - a.pct).forEach(h => {
        const chip = document.createElement('div');
        chip.className = 'nutrition-chip';
        chip.style.borderColor = 'rgba(127,255,212,0.2)';
        chip.innerHTML = `
      <div class="ico">${h.hint.icon}</div>
      <div class="nut-name">${h.hint.category}</div>
      <div class="nut-hint">${h.hint.hint}</div>
    `;
        grid.appendChild(chip);
    });
}
