"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var hls_media_types_1 = require("./hls-media-types");
function canPlayHls() {
    var doc = typeof document === 'object' && document;
    var videoElement = doc && doc.createElement('video');
    var isVideoSupported = Boolean(videoElement && videoElement.canPlayType);
    return (isVideoSupported &&
        hls_media_types_1.hlsMimeTypes.some(function (canItPlay) {
            if (videoElement) {
                return /maybe|probably/i.test(videoElement.canPlayType(canItPlay));
            }
            return false;
        }));
}
exports.canPlayHls = canPlayHls;
//# sourceMappingURL=can-play-hls.js.map