"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var virtual_canvas_1 = require("../elements/virtual-canvas");
function isVirtual(canvas) {
    if (!canvas) {
        return false;
    }
    return canvas instanceof virtual_canvas_1.VirtualCanvas;
}
exports.isVirtual = isVirtual;
//# sourceMappingURL=is-virtual.js.map