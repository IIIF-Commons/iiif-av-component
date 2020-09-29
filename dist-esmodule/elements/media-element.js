var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { DashFormat } from '../media-formats/dash-format';
import { HlsFormat } from '../media-formats/hls-format';
import { MpegFormat } from '../media-formats/mpeg-format';
import { DefaultFormat } from '../media-formats/default-format';
var MediaElement = /** @class */ (function () {
    function MediaElement(source, mediaOptions) {
        if (mediaOptions === void 0) { mediaOptions = {}; }
        this.source = source;
        this.mediaSource = source.mediaSource;
        this.type = source.type.toString().toLowerCase();
        this.format = source.format ? source.format.toString() : undefined;
        this.mediaSyncMarginSecs = mediaOptions.mediaSyncMarginSecs || 1;
        switch (this.type) {
            case 'video':
                this.element = document.createElement('video');
                break;
            case 'sound':
            case 'audio':
                this.element = document.createElement('audio');
                break;
            default:
                return;
        }
        if (this.isDash()) {
            this.instance = new DashFormat(this.mediaSource, mediaOptions);
        }
        else if (this.isHls()) {
            this.instance = new HlsFormat(this.mediaSource, mediaOptions);
        }
        else if (this.isMpeg()) {
            this.instance = new MpegFormat(this.mediaSource, mediaOptions);
        }
        else {
            this.instance = new DefaultFormat(this.mediaSource, mediaOptions);
        }
        this.element.classList.add('anno');
        this.element.crossOrigin = 'anonymous';
        this.element.preload = 'metadata';
        this.element.pause();
        this.instance.attachTo(this.element);
        this.element.currentTime = this.source.start;
    }
    MediaElement.prototype.syncClock = function (time) {
        if (Math.abs(this.element.currentTime - time) > this.mediaSyncMarginSecs) {
            this.element.currentTime = time;
        }
    };
    MediaElement.prototype.getCanvasId = function () {
        return this.source.canvasId;
    };
    MediaElement.prototype.isWithinRange = function (time) {
        return this.source.start <= time && this.source.end >= time;
    };
    MediaElement.prototype.load = function (withAudio) {
        if (withAudio === void 0) { withAudio = false; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (withAudio) {
                            this.element.load();
                        }
                        return [4 /*yield*/, new Promise(function (resolve) {
                                _this.element.addEventListener('loadedmetadata', function () {
                                    resolve();
                                });
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MediaElement.prototype.setSize = function (top, left, width, height) {
        $(this.element).css({
            top: top + "%",
            left: left + "%",
            width: width + "%",
            height: height + "%",
        });
    };
    MediaElement.prototype.isDash = function () {
        return this.format && this.format.toString() === 'application/dash+xml';
    };
    MediaElement.prototype.isHls = function () {
        return this.format && this.format.toString() === 'application/vnd.apple.mpegurl' && Hls && Hls.isSupported();
    };
    MediaElement.prototype.isMpeg = function () {
        return this.element.canPlayType('application/vnd.apple.mpegurl') !== '';
    };
    MediaElement.prototype.stop = function () {
        this.element.pause();
        this.element.currentTime = this.source.start;
    };
    MediaElement.prototype.play = function (time) {
        if (time) {
            this.element.currentTime = time;
        }
        return this.element.play();
    };
    MediaElement.prototype.pause = function () {
        this.element.pause();
    };
    MediaElement.prototype.isBuffering = function () {
        return this.element.readyState < 3;
    };
    return MediaElement;
}());
export { MediaElement };
//# sourceMappingURL=media-element.js.map