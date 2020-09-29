"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var hls_media_types_1 = require("./hls-media-types");
function isHLSFormat(format) {
    return hls_media_types_1.hlsMimeTypes.includes(format.toString());
}
exports.isHLSFormat = isHLSFormat;
//# sourceMappingURL=is-hls-format.js.map