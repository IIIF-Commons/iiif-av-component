"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getSpatialComponent(target) {
    var spatial = /xywh=([^&]+)/g.exec(target);
    var xywh = null;
    if (spatial && spatial[1]) {
        xywh = spatial[1].split(',');
    }
    return xywh;
}
exports.getSpatialComponent = getSpatialComponent;
//# sourceMappingURL=get-spatial-component.js.map