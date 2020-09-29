"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var abstract_media_format_1 = require("./abstract-media-format");
var HlsFormat = /** @class */ (function (_super) {
    __extends(HlsFormat, _super);
    function HlsFormat(source, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, source, options) || this;
        if (options.adaptiveAuthEnabled) {
            _this.hls = new Hls({
                xhrSetup: function (xhr) {
                    xhr.withCredentials = true; // send cookies
                },
            });
        }
        else {
            _this.hls = new Hls();
        }
        _this.hls.loadSource(_this.source);
        return _this;
    }
    HlsFormat.prototype.attachTo = function (element) {
        this.hls.attachMedia(element);
    };
    return HlsFormat;
}(abstract_media_format_1.MediaFormat));
exports.HlsFormat = HlsFormat;
//# sourceMappingURL=hls-format.js.map