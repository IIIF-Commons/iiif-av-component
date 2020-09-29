export function getSpatialComponent(target) {
    var spatial = /xywh=([^&]+)/g.exec(target);
    var xywh = null;
    if (spatial && spatial[1]) {
        xywh = spatial[1].split(',');
    }
    return xywh;
}
//# sourceMappingURL=get-spatial-component.js.map