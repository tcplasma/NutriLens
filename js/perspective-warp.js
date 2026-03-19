// ═══════════════════════════════════════════════
//  PERSPECTIVE WARP (Ellipse → Circle)
// ═══════════════════════════════════════════════

/**
 * Warps an image region containing an ellipse into a perfect circle.
 * Compensates for the perspective distortion when a plate is shot at an angle.
 *
 * @param {HTMLCanvasElement|ImageBitmap|ImageData} srcImage - Source image
 * @param {Object} ellipse - {cx, cy, a, b, theta} from fitEllipse
 * @returns {HTMLCanvasElement} A new canvas containing the warped, circular plate
 */
function warpEllipseToCircle(srcImage, ellipse) {
    const { cx, cy, a, b, theta } = ellipse;
    
    // The target canvas is a square bounding the un-squashed circle
    const diameter = Math.ceil(a * 2);
    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = dstCanvas.height = diameter;
    const ctx = dstCanvas.getContext('2d');

    // 1. Move to center of new canvas
    ctx.translate(a, a);
    
    // 2. Un-rotate the ellipse so its axes align with X/Y
    ctx.rotate(-theta);
    
    // 3. Scale the Y axis (minor axis) up to match the X axis (major axis)
    //    This "inflates" the ellipse back into a circle
    ctx.scale(1, a / b);
    
    // 4. Re-rotate if needed (usually visual preference, but mathematically
    //    keeping the original orientation is better for mapping back)
    ctx.rotate(theta);
    
    // 5. Shift back so the center of the original ellipse is at (0,0) for drawing
    ctx.translate(-cx, -cy);
    
    // 6. Draw the original image. The transform matrix handles the warping.
    if (srcImage instanceof ImageData) {
        // Can't draw ImageData directly with transforms, must put on temp canvas first
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = srcImage.width;
        tmpCanvas.height = srcImage.height;
        tmpCanvas.getContext('2d').putImageData(srcImage, 0, 0);
        ctx.drawImage(tmpCanvas, 0, 0);
    } else {
        ctx.drawImage(srcImage, 0, 0);
    }

    return dstCanvas;
}

/**
 * Maps a point from the warped (circular) image back to the original (elliptical) image coords.
 * Useful if we need to draw clustering results back onto the original photo.
 * 
 * @param {number} wx - X coord in warped image
 * @param {number} wy - Y coord in warped image
 * @param {Object} ellipse - {cx, cy, a, b, theta}
 * @returns {Array} [ox, oy] - Coords in original image
 */
function inverseWarpPoint(wx, wy, ellipse) {
    const { cx, cy, a, b, theta } = ellipse;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    
    // Remove center offset of warped image
    let x = wx - a;
    let y = wy - a;
    
    // Inverse rotate
    let rx = x * cosT + y * sinT;
    let ry = -x * sinT + y * cosT;
    
    // Inverse scale (squash)
    ry *= (b / a);
    
    // Re-rotate
    x = rx * cosT - ry * sinT;
    y = rx * sinT + ry * cosT;
    
    // Add original center offset
    return [Math.round(x + cx), Math.round(y + cy)];
}
