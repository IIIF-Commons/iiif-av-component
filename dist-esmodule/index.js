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
import { Behavior } from "@iiif/vocabulary";
import { Utils } from "manifesto.js";
import { BaseComponent } from "@iiif/base-component";
import { CanvasInstance, CanvasInstanceEvents } from "./CanvasInstance";
import { AVComponentUtils } from "./Utils";
import { VirtualCanvas } from "./VirtualCanvas";
import { VolumeEvents } from "./VolumeControl";
var AVComponent = /** @class */ (function (_super) {
    __extends(AVComponent, _super);
    function AVComponent(options) {
        var _this = _super.call(this, options) || this;
        _this.canvasInstances = [];
        _this._data = _this.data();
        _this._readyMedia = 0;
        _this._readyWaveforms = 0;
        _this._posterCanvasWidth = 0;
        _this._posterCanvasHeight = 0;
        _this._posterImageExpanded = false;
        _this._init();
        _this._resize();
        return _this;
    }
    AVComponent.prototype._init = function () {
        _super.prototype._init.call(this);
        this._$element = $(this.el);
        return true;
    };
    AVComponent.prototype.data = function () {
        return {
            autoPlay: false,
            constrainNavigationToRange: false,
            defaultAspectRatio: 0.56,
            doubleClickMS: 350,
            halveAtWidth: 200,
            limitToRange: false,
            posterImageRatio: 0.3,
            virtualCanvasEnabled: true,
            content: {
                currentTime: "Current Time",
                collapse: "Collapse",
                duration: "Duration",
                expand: "Expand",
                mute: "Mute",
                next: "Next",
                pause: "Pause",
                play: "Play",
                previous: "Previous",
                unmute: "Unmute",
                fullscreen: "Fullscreen"
            }
        };
    };
    AVComponent.prototype.set = function (data) {
        var _this = this;
        var oldData = Object.assign({}, this._data);
        this._data = Object.assign(this._data, data);
        var diff = AVComponentUtils.diff(oldData, this._data);
        // changing any of these data properties forces a reload.
        if (diff.includes("helper")) {
            // create canvases
            this._reset();
        }
        if (!this._data.helper) {
            console.warn("must pass a helper object");
            return;
        }
        if (diff.includes("limitToRange") && this._data.canvasId) {
            this.canvasInstances.forEach(function (canvasInstance, index) {
                canvasInstance.set({
                    limitToRange: _this._data.limitToRange
                });
            });
        }
        if (diff.includes("constrainNavigationToRange") && this._data.canvasId) {
            this.canvasInstances.forEach(function (canvasInstance, index) {
                canvasInstance.set({
                    constrainNavigationToRange: _this._data.constrainNavigationToRange
                });
            });
        }
        if (diff.includes("autoSelectRange") && this._data.canvasId) {
            this.canvasInstances.forEach(function (canvasInstance, index) {
                canvasInstance.set({
                    autoSelectRange: _this._data.autoSelectRange
                });
            });
        }
        if (diff.includes("canvasId") && this._data.canvasId) {
            var nextCanvasInstance_1 = this._getCanvasInstanceById(this._data.canvasId);
            if (nextCanvasInstance_1) {
                this.canvasInstances.forEach(function (canvasInstance) {
                    // hide canvases that don't have the same id
                    if (canvasInstance.getCanvasId() !== nextCanvasInstance_1.getCanvasId()) {
                        canvasInstance.set({
                            visible: false
                        });
                    }
                    else {
                        if (diff.includes("range")) {
                            canvasInstance.set({
                                visible: true,
                                range: _this._data.range
                                    ? jQuery.extend(true, {}, _this._data.range)
                                    : undefined
                            });
                        }
                        else {
                            canvasInstance.set({
                                visible: true
                            });
                        }
                    }
                });
            }
        }
        if (diff.includes("virtualCanvasEnabled")) {
            this.set({
                range: undefined
            });
            // as you don't know the id of virtual canvases, you can toggle them on
            // but when toggling off, you must call showCanvas to show the next canvas
            if (this._data.virtualCanvasEnabled) {
                this.canvasInstances.forEach(function (canvasInstance) {
                    if (canvasInstance.isVirtual()) {
                        _this.set({
                            canvasId: canvasInstance.getCanvasId(),
                            range: undefined
                        });
                    }
                });
            }
        }
        if (diff.includes("range") && this._data.range) {
            var range = this._data.helper.getRangeById(this._data.range.id);
            if (!range) {
                console.warn("range not found");
            }
            else {
                var canvasId = AVComponentUtils.getFirstTargetedCanvasId(range);
                if (canvasId) {
                    // get canvas by normalised id (without temporal part)
                    var canvasInstance = this._getCanvasInstanceById(canvasId);
                    if (canvasInstance) {
                        if (canvasInstance.isVirtual() && this._data.virtualCanvasEnabled) {
                            if (canvasInstance.includesVirtualSubCanvas(canvasId)) {
                                canvasId = canvasInstance.getCanvasId();
                                // use the retargeted range
                                for (var i = 0; i < canvasInstance.ranges.length; i++) {
                                    var r = canvasInstance.ranges[i];
                                    if (r.id === range.id) {
                                        range = r;
                                        break;
                                    }
                                }
                            }
                        }
                        // if not using the correct canvasinstance, switch to it
                        if (this._data.canvasId &&
                            (this._data.canvasId.includes("://")
                                ? Utils.normaliseUrl(this._data.canvasId)
                                : this._data.canvasId) !== canvasId) {
                            this.set({
                                canvasId: canvasId,
                                range: jQuery.extend(true, {}, range) // force diff
                            });
                        }
                        else {
                            canvasInstance.set({
                                range: jQuery.extend(true, {}, range)
                            });
                        }
                    }
                }
            }
        }
        this._render();
        this._resize();
    };
    AVComponent.prototype._render = function () { };
    AVComponent.prototype.reset = function () {
        this._reset();
    };
    AVComponent.prototype._reset = function () {
        var _this = this;
        this._readyMedia = 0;
        this._readyWaveforms = 0;
        this._posterCanvasWidth = 0;
        this._posterCanvasHeight = 0;
        clearInterval(this._checkAllMediaReadyInterval);
        clearInterval(this._checkAllWaveformsReadyInterval);
        this.canvasInstances.forEach(function (canvasInstance) {
            canvasInstance.destroy();
        });
        this.canvasInstances = [];
        this._$element.empty();
        if (this._data && this._data.helper && this._data.helper.manifest) {
            // if the manifest has an auto-advance behavior, join the canvases into a single "virtual" canvas
            var behavior = this._data.helper.manifest.getBehavior();
            var canvases = this._getCanvases();
            if (behavior && behavior.toString() === Behavior.AUTO_ADVANCE) {
                var virtualCanvas_1 = new VirtualCanvas();
                canvases.forEach(function (canvas) {
                    virtualCanvas_1.addCanvas(canvas);
                });
                this._initCanvas(virtualCanvas_1);
            }
            // all canvases need to be individually navigable
            canvases.forEach(function (canvas) {
                _this._initCanvas(canvas);
            });
            if (this.canvasInstances.length > 0) {
                this._data.canvasId = this.canvasInstances[0].getCanvasId();
            }
            this._checkAllMediaReadyInterval = setInterval(this._checkAllMediaReady.bind(this), 100);
            this._checkAllWaveformsReadyInterval = setInterval(this._checkAllWaveformsReady.bind(this), 100);
            this._$posterContainer = $('<div class="poster-container"></div>');
            this._$element.append(this._$posterContainer);
            this._$posterImage = $('<div class="poster-image"></div>');
            this._$posterExpandButton = $("\n                <button class=\"btn\" title=\"" + (this._data && this._data.content
                ? this._data.content.expand
                : "") + "\">\n                    <i class=\"av-icon  av-icon-expand expand\" aria-hidden=\"true\"></i><span>" + (this._data && this._data.content
                ? this._data.content.expand
                : "") + "</span>\n                </button>\n            ");
            this._$posterImage.append(this._$posterExpandButton);
            this._$posterImage.on("touchstart click", function (e) {
                e.preventDefault();
                var target = _this._getPosterImageCss(!_this._posterImageExpanded);
                //this._$posterImage.animate(target,"fast", "easein");
                _this._$posterImage.animate(target);
                _this._posterImageExpanded = !_this._posterImageExpanded;
                if (_this._data.content) {
                    if (_this._posterImageExpanded) {
                        var label = _this._data.content.collapse;
                        _this._$posterExpandButton.prop("title", label);
                        _this._$posterExpandButton
                            .find("i")
                            .switchClass("expand", "collapse");
                    }
                    else {
                        var label = _this._data.content.expand;
                        _this._$posterExpandButton.prop("title", label);
                        _this._$posterExpandButton
                            .find("i")
                            .switchClass("collapse", "expand");
                    }
                }
            });
            // poster canvas
            var posterCanvas = this._data.helper.getPosterCanvas();
            if (posterCanvas) {
                this._posterCanvasWidth = posterCanvas.getWidth();
                this._posterCanvasHeight = posterCanvas.getHeight();
                var posterImage = this._data.helper.getPosterImage();
                if (posterImage) {
                    this._$posterContainer.append(this._$posterImage);
                    var css = this._getPosterImageCss(this._posterImageExpanded);
                    css = Object.assign({}, css, {
                        "background-image": "url(" + posterImage + ")"
                    });
                    this._$posterImage.css(css);
                }
            }
        }
    };
    AVComponent.prototype._checkAllMediaReady = function () {
        //console.log("loading media");
        if (this._readyMedia === this.canvasInstances.length) {
            //console.log("all media ready");
            clearInterval(this._checkAllMediaReadyInterval);
            //that._logMessage('CREATED CANVAS: ' + canvasInstance.canvasClockDuration + ' seconds, ' + canvasInstance.canvasWidth + ' x ' + canvasInstance.canvasHeight + ' px.');
            this.fire(Events.MEDIA_READY);
            this.resize();
        }
    };
    AVComponent.prototype._checkAllWaveformsReady = function () {
        //console.log("loading waveforms");
        if (this._readyWaveforms === this._getCanvasInstancesWithWaveforms().length) {
            //console.log("waveforms ready");
            clearInterval(this._checkAllWaveformsReadyInterval);
            this.fire(Events.WAVEFORMS_READY);
            this.resize();
        }
    };
    AVComponent.prototype._getCanvasInstancesWithWaveforms = function () {
        return this.canvasInstances.filter(function (c) {
            return c.waveforms.length > 0;
        });
    };
    AVComponent.prototype._getCanvases = function () {
        if (this._data.helper) {
            return this._data.helper.getCanvases();
        }
        return [];
    };
    AVComponent.prototype._initCanvas = function (canvas) {
        var _this = this;
        var canvasInstance = new CanvasInstance({
            target: document.createElement("div"),
            data: Object.assign({}, { canvas: canvas }, this._data)
        });
        canvasInstance.logMessage = this._logMessage.bind(this);
        canvasInstance.isOnlyCanvasInstance = this._getCanvases().length === 1;
        this._$element.append(canvasInstance.$playerElement);
        canvasInstance.init();
        this.canvasInstances.push(canvasInstance);
        canvasInstance.on(Events.MEDIA_READY, function () {
            _this._readyMedia++;
        }, false);
        canvasInstance.on(Events.WAVEFORM_READY, function () {
            _this._readyWaveforms++;
        }, false);
        // canvasInstance.on(Events.RESETCANVAS, () => {
        //     this.playCanvas(canvasInstance.canvas.id);
        // }, false);
        canvasInstance.on(CanvasInstanceEvents.PREVIOUS_RANGE, function () {
            _this._prevRange();
        }, false);
        canvasInstance.on(CanvasInstanceEvents.NEXT_RANGE, function () {
            _this._nextRange();
        }, false);
        canvasInstance.on(Events.RANGE_CHANGED, function (rangeId) {
            _this.fire(Events.RANGE_CHANGED, rangeId);
        }, false);
        canvasInstance.on(VolumeEvents.VOLUME_CHANGED, function (volume) {
            _this._setCanvasInstanceVolumes(volume);
            _this.fire(VolumeEvents.VOLUME_CHANGED, volume);
        }, false);
        canvasInstance.on(CanvasInstanceEvents.PLAYCANVAS, function () {
            _this.fire(CanvasInstanceEvents.PLAYCANVAS);
        }, false);
        canvasInstance.on(CanvasInstanceEvents.PAUSECANVAS, function () {
            _this.fire(CanvasInstanceEvents.PAUSECANVAS);
        }, false);
        canvasInstance.on(Events.MEDIA_ERROR, function (error) {
            clearInterval(_this._checkAllMediaReadyInterval);
            _this.fire(Events.MEDIA_ERROR, error, canvas.id);
        }, false);
        canvasInstance.on(Events.FULLSCREEN, function (state) {
            _this.fire(Events.FULLSCREEN, state);
        }, false);
    };
    AVComponent.prototype._prevRange = function () {
        if (!this._data || !this._data.helper) {
            return;
        }
        var prevRange = this._data.helper.getPreviousRange();
        if (prevRange) {
            this.playRange(prevRange.id);
        }
        else {
            // no previous range. rewind.
            this._rewind();
        }
    };
    AVComponent.prototype._nextRange = function () {
        if (!this._data || !this._data.helper) {
            return;
        }
        var nextRange = this._data.helper.getNextRange();
        if (nextRange) {
            this.playRange(nextRange.id);
        }
    };
    AVComponent.prototype._setCanvasInstanceVolumes = function (volume) {
        this.canvasInstances.forEach(function (canvasInstance) {
            canvasInstance.set({
                volume: volume
            });
        });
    };
    AVComponent.prototype._getNormaliseCanvasId = function (canvasId) {
        return canvasId.includes("://") ? Utils.normaliseUrl(canvasId) : canvasId;
    };
    AVComponent.prototype._getCanvasInstanceById = function (canvasId) {
        canvasId = this._getNormaliseCanvasId(canvasId);
        // if virtual canvas is enabled, check for that first
        if (this._data.virtualCanvasEnabled) {
            for (var i = 0; i < this.canvasInstances.length; i++) {
                var canvasInstance = this.canvasInstances[i];
                var currentCanvasId = canvasInstance.getCanvasId();
                if (currentCanvasId) {
                    currentCanvasId = this._getNormaliseCanvasId(currentCanvasId);
                    if (((canvasInstance.isVirtual() ||
                        this.canvasInstances.length === 1) &&
                        currentCanvasId === canvasId) ||
                        canvasInstance.includesVirtualSubCanvas(canvasId)) {
                        return canvasInstance;
                    }
                }
            }
        }
        else {
            for (var i = 0; i < this.canvasInstances.length; i++) {
                var canvasInstance = this.canvasInstances[i];
                var id = canvasInstance.getCanvasId();
                if (id) {
                    var canvasInstanceId = Utils.normaliseUrl(id);
                    if (canvasInstanceId === canvasId) {
                        return canvasInstance;
                    }
                }
            }
        }
        return undefined;
    };
    AVComponent.prototype._getCurrentCanvas = function () {
        if (this._data.canvasId) {
            return this._getCanvasInstanceById(this._data.canvasId);
        }
        return undefined;
    };
    AVComponent.prototype._rewind = function () {
        if (this._data.limitToRange) {
            return;
        }
        var canvasInstance = this._getCurrentCanvas();
        if (canvasInstance) {
            canvasInstance.set({
                range: undefined
            });
        }
    };
    AVComponent.prototype.play = function () {
        var currentCanvas = this._getCurrentCanvas();
        if (currentCanvas) {
            currentCanvas.play();
        }
    };
    AVComponent.prototype.pause = function () {
        var currentCanvas = this._getCurrentCanvas();
        if (currentCanvas) {
            currentCanvas.pause();
        }
    };
    AVComponent.prototype.playRange = function (rangeId) {
        if (!this._data.helper) {
            return;
        }
        var range = this._data.helper.getRangeById(rangeId);
        if (range) {
            this.set({
                range: jQuery.extend(true, {}, range)
            });
        }
    };
    AVComponent.prototype.showCanvas = function (canvasId) {
        // if the passed canvas id is already the current canvas id, but the canvas isn't visible
        // (switching from virtual canvas)
        var currentCanvas = this._getCurrentCanvas();
        if (currentCanvas &&
            currentCanvas.getCanvasId() === canvasId &&
            !currentCanvas.isVisible()) {
            currentCanvas.set({
                visible: true
            });
        }
        else {
            this.set({
                canvasId: canvasId
            });
        }
    };
    AVComponent.prototype._logMessage = function (message) {
        this.fire(Events.LOG, message);
    };
    AVComponent.prototype._getPosterImageCss = function (expanded) {
        var currentCanvas = this._getCurrentCanvas();
        if (currentCanvas) {
            var $options = currentCanvas.$playerElement.find(".options-container");
            var containerWidth = (currentCanvas.$playerElement.parent().width());
            var containerHeight = currentCanvas.$playerElement.parent().height() -
                $options.height();
            if (expanded) {
                return {
                    top: 0,
                    left: 0,
                    width: containerWidth,
                    height: containerHeight
                };
            }
            else {
                // get the longer edge of the poster canvas and make that a ratio of the container height/width.
                // scale the shorter edge proportionally.
                var ratio = void 0;
                var width = void 0;
                var height = void 0;
                if (this._posterCanvasWidth > this._posterCanvasHeight) {
                    ratio = this._posterCanvasHeight / this._posterCanvasWidth;
                    width = containerWidth * this._data.posterImageRatio;
                    height = width * ratio;
                }
                else {
                    // either height is greater, or width and height are equal
                    ratio = this._posterCanvasWidth / this._posterCanvasHeight;
                    height = containerHeight * this._data.posterImageRatio;
                    width = height * ratio;
                }
                return {
                    top: 0,
                    left: containerWidth - width,
                    width: width,
                    height: height
                };
            }
        }
        return null;
    };
    AVComponent.prototype.resize = function () {
        this.canvasInstances.forEach(function (canvasInstance) {
            canvasInstance.resize();
        });
        // get the visible player and align the poster to it
        var currentCanvas = this._getCurrentCanvas();
        if (currentCanvas) {
            if (this._$posterImage && this._$posterImage.is(":visible")) {
                if (this._posterImageExpanded) {
                    this._$posterImage.css(this._getPosterImageCss(true));
                }
                else {
                    this._$posterImage.css(this._getPosterImageCss(false));
                }
                // this._$posterExpandButton.css({
                //     top: <number>this._$posterImage.height() - <number>this._$posterExpandButton.outerHeight()
                // });
            }
        }
    };
    return AVComponent;
}(BaseComponent));
export { AVComponent };
var Events = /** @class */ (function () {
    function Events() {
    }
    Events.MEDIA_READY = "mediaready";
    Events.MEDIA_ERROR = 'mediaerror';
    Events.LOG = "log";
    Events.RANGE_CHANGED = "rangechanged";
    Events.WAVEFORM_READY = "waveformready";
    Events.WAVEFORMS_READY = "waveformsready";
    Events.FULLSCREEN = 'fullscreen';
    return Events;
}());
export { Events };
//# sourceMappingURL=index.js.map