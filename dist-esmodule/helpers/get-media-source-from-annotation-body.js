import { Utils } from 'manifesto.js';
import { getSpatialComponent } from './get-spatial-component';
export function getMediaSourceFromAnnotationBody(annotation, body, canvasDimensions) {
    var type = body.getType();
    var format = body.getFormat() || undefined;
    var mediaSource = body.id.split('#')[0];
    var target = annotation.getTarget();
    if (!target) {
        throw new Error('No target');
    }
    if (!type) {
        throw new Error('Unknown media type');
    }
    var _a = getSpatialComponent(target) || [
        0,
        0,
        canvasDimensions.width || 0,
        canvasDimensions.height || 0,
    ], x = _a[0], y = _a[1], width = _a[2], height = _a[3];
    var _b = Utils.getTemporalComponent(target) || [0, canvasDimensions.duration], start = _b[0], end = _b[1];
    var _c = body.id.match(/(.*)#t=([0-9.]+),?([0-9.]+)?/) || [
        undefined,
        body.id,
        undefined,
        undefined,
    ], bodyId = _c[1], offsetStart = _c[2], offsetEnd = _c[3];
    return {
        type: type,
        format: format,
        mediaSource: mediaSource,
        canvasId: canvasDimensions.id,
        x: x,
        y: y,
        width: typeof width === 'undefined' ? undefined : parseInt(String(width), 10),
        height: typeof height === 'undefined' ? undefined : parseInt(String(height), 10),
        start: Number(Number(start).toFixed(2)),
        end: Number(Number(end).toFixed(2)),
        bodyId: bodyId,
        offsetStart: typeof offsetStart === 'undefined' ? undefined : parseFloat(offsetStart),
        offsetEnd: typeof offsetEnd === 'undefined' ? undefined : parseFloat(offsetEnd),
    };
}
//# sourceMappingURL=get-media-source-from-annotation-body.js.map