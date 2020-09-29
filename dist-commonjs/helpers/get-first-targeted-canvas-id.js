"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var manifesto_js_1 = require("manifesto.js");
function getFirstTargetedCanvasId(range) {
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
        return manifesto_js_1.Utils.normaliseUrl(canvasId);
    }
    return undefined;
}
exports.getFirstTargetedCanvasId = getFirstTargetedCanvasId;
//# sourceMappingURL=get-first-targeted-canvas-id.js.map