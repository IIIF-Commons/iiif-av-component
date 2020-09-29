"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MediaFormat = /** @class */ (function () {
    function MediaFormat(source, options) {
        if (options === void 0) { options = {}; }
        this.source = source;
        this.options = options;
    }
    MediaFormat.prototype.attachTo = function (element) {
        element.setAttribute('src', this.source);
    };
    return MediaFormat;
}());
exports.MediaFormat = MediaFormat;
//# sourceMappingURL=abstract-media-format.js.map