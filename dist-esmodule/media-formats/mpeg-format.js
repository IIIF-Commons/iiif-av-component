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
import { MediaFormat } from './abstract-media-format';
var MpegFormat = /** @class */ (function (_super) {
    __extends(MpegFormat, _super);
    function MpegFormat(source, options) {
        if (options === void 0) { options = {}; }
        return _super.call(this, source, options) || this;
    }
    MpegFormat.prototype.attachTo = function (element) {
        element.src = this.source;
    };
    return MpegFormat;
}(MediaFormat));
export { MpegFormat };
//# sourceMappingURL=mpeg-format.js.map