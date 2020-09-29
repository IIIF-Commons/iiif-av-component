import { hlsMimeTypes } from './hls-media-types';
export function isHLSFormat(format) {
    return hlsMimeTypes.includes(format.toString());
}
//# sourceMappingURL=is-hls-format.js.map