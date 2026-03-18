# NutriLens · Plate Food Color Analyzer

A client-side food color analysis tool, completely free to deploy, with no backend server required.

## Features

- Upload a photo or use demo images
- Automatic white plate detection (simplified Hough circle detection)
- Mini-batch K-Means color clustering (runs locally in the browser, no data uploaded)
- Output: color proportions, RGB values, silhouette score
- Nutritional color hints (red → protein, green → vegetables, orange → beta-carotene…)
- Direct camera capture on mobile devices

## Deploy to GitHub Pages (Free)

1. Create a new repository on GitHub (e.g., `nutrilens`)
2. Upload all project files to the repository
3. Go to Settings → Pages → Source and select **main branch**
4. After about 1 minute, access it at `https://your-username.github.io/nutrilens`

## Install as PWA on Mobile

After deploying, open the URL on your phone in Chrome/Safari and tap "Add to Home Screen" to use it like a native app.

## Local Testing

Simply open `index.html` in a browser (no server required).

## Tech Stack

| Requirement | Implementation |
|-------------|---------------|
| K-Means Clustering | Pure JavaScript (Mini-batch K-Means with K-means++ init) |
| Plate Detection | White pixel distribution analysis |
| Image Processing | Canvas API |
| UI | Pure HTML/CSS |
| Cost | $0 |

## Project Structure

```
Nutrilens/
├── index.html              # Main HTML (slim shell)
├── manifest.json           # PWA manifest
├── README.md
├── css/
│   └── style.css           # All styles
└── js/
    ├── state.js            # Global state
    ├── utils.js            # Progress helper, sleep
    ├── color-utils.js      # RGB/HSV/hex, color labels, nutrition mapping
    ├── plate-detection.js  # White plate detection, food mask
    ├── kmeans.js           # Mini-batch K-Means, K-means++, silhouette
    ├── canvas-renderer.js  # Mask/clustered/overlay canvas rendering
    ├── results.js          # Results display, nutrition hints
    ├── image-loader.js     # Image loading & preview
    ├── demo.js             # Demo image generators
    ├── upload.js           # Drag & drop, file input
    └── analysis.js         # Main analysis pipeline
```

## Notes

- Recommended: use images with white plate and clear food color contrast
- Analysis runs entirely in the browser — no images are uploaded
- On mobile, simply take a photo and upload for analysis
