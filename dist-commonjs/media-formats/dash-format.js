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
var DashFormat = /** @class */ (function (_super) {
    __extends(DashFormat, _super);
    function DashFormat(source, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, source, options) || this;
        _this.player = dashjs.MediaPlayer().create();
        _this.player.getDebug().setLogToBrowserConsole(false);
        if (options.adaptiveAuthEnabled) {
            _this.player.setXHRWithCredentialsForType('MPD', true); // send cookies
        }
        return _this;
    }
    DashFormat.prototype.attachTo = function (element) {
        this.player.initialize(element, this.source, false);
    };
    DashFormat.prototype.debug = function () {
        this.player.getDebug().setLogToBrowserConsole(true);
        this.player.getDebug().setLogLevel(4);
    };
    return DashFormat;
}(abstract_media_format_1.MediaFormat));
exports.DashFormat = DashFormat;
//# sourceMappingURL=dash-format.js.map