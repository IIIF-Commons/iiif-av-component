import { Utils } from 'manifesto.js';
export function getFirstTargetedCanvasId(range) {
    var canvasId;
    if (range.canvases && range.canvases.length) {
        canvasId = range.canvases[0];
    }
    else {
        var childRanges = range.getRanges();
        if (childRanges.length) {
            return getFirstTargetedCanvasId(childRanges[0]);
        }
    }
    if (canvasId !== undefined) {
        return Utils.normaliseUrl(canvasId);
    }
    return undefined;
}
//# sourceMappingURL=get-first-targeted-canvas-id.js.map