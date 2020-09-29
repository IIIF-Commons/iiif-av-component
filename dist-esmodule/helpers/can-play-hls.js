import { hlsMimeTypes } from './hls-media-types';
export function canPlayHls() {
    var doc = typeof document === 'object' && document;
    var videoElement = doc && doc.createElement('video');
    var isVideoSupported = Boolean(videoElement && videoElement.canPlayType);
    return (isVideoSupported &&
        hlsMimeTypes.some(function (canItPlay) {
            if (videoElement) {
                return /maybe|probably/i.test(videoElement.canPlayType(canItPlay));
            }
            return false;
        }));
}
//# sourceMappingURL=can-play-hls.js.map