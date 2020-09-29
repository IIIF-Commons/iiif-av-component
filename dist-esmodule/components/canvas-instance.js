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
import { Utils } from 'manifesto.js';
import { BaseComponent } from '@iiif/base-component';
import { MediaElement } from '../elements/media-element';
import { TimePlanPlayer } from '../elements/timeplan-player';
import { VolumeEvents } from '../events/volume-events';
import { extractMediaFromAnnotationBodies } from '../helpers/extract-media-from-annotation-bodies';
import { AVVolumeControl } from './volume-control';
import { CompositeMediaElement } from '../elements/composite-media-element';
import { createTimePlansFromManifest } from '../helpers/create-time-plans-from-manifest';
import { getMediaSourceFromAnnotationBody } from '../helpers/get-media-source-from-annotation-body';
import { CanvasInstanceEvents } from '../events/canvas-instance-events';
import { AVComponent } from './av-component';
import { VirtualCanvas } from '../elements/virtual-canvas';
import { CompositeWaveform } from '../elements/composite-waveform';
import { Events } from '../events/av-component-events';
import { isHLSFormat } from '../helpers/is-hls-format';
import { isMpegDashFormat } from '../helpers/is-mpeg-dash-format';
import { retargetTemporalComponent } from '../helpers/retarget-temporal-component';
import { getSpatialComponent } from '../helpers/get-spatial-component';
import { canPlayHls } from '../helpers/can-play-hls';
import { formatTime } from '../helpers/format-time';
import { isSafari } from '../helpers/is-safari';
import { normalise } from '../helpers/normalise-number';
import { diffData } from '../helpers/diff-data';
import { isVirtual } from '../helpers/is-virtual';
var CanvasInstance = /** @class */ (function (_super) {
    __extends(CanvasInstance, _super);
    function CanvasInstance(options) {
        var _this = _super.call(this, options) || this;
        _this._canvasClockFrequency = 25;
        _this._canvasClockStartDate = 0;
        _this._canvasClockTime = 0;
        _this._canvasHeight = 0;
        _this._canvasWidth = 0;
        _this._data = _this.data();
        _this._highPriorityFrequency = 25;
        _this._isPlaying = false;
        _this._isStalled = false;
        //private _lastCanvasHeight: number | undefined;
        //private _lastCanvasWidth: number | undefined;
        _this._lowPriorityFrequency = 250;
        _this._mediaSyncMarginSecs = 1;
        _this._rangeSpanPadding = 0.25;
        _this._readyMediaCount = 0;
        _this._stallRequestedBy = []; //todo: type
        _this._wasPlaying = false;
        //private _waveformNeedsRedraw: boolean = true;
        _this.ranges = [];
        _this.waveforms = [];
        _this._buffering = false;
        _this._bufferShown = false;
        _this.isOnlyCanvasInstance = false;
        _this.waveformDeltaX = 0;
        _this.waveformPageX = 0;
        _this.waveFormInit = false;
        _this._scaleY = function (amplitude, height) {
            var range = 256;
            return Math.max(_this._data.waveformBarWidth, (amplitude * height) / range);
        };
        _this._$element = $(_this.options.target);
        _this._data = _this.options.data;
        _this.$playerElement = $('<div class="player player--loading"></div>');
        return _this;
    }
    CanvasInstance.prototype.loaded = function () {
        var _this = this;
        setTimeout(function () {
            _this.$playerElement.removeClass('player--loading');
        }, 500);
    };
    CanvasInstance.prototype.isPlaying = function () {
        return this._isPlaying;
    };
    CanvasInstance.prototype.getClockTime = function () {
        return this._canvasClockTime;
    };
    CanvasInstance.prototype.createTimeStops = function () {
        var _this = this;
        var helper = this._data.helper;
        var virtualCanvas = this._data.canvas;
        if (!helper || !virtualCanvas) {
            return;
        }
        this.ranges = [];
        this._contentAnnotations = [];
        var canvases = virtualCanvas.canvases;
        var mediaElements = [];
        for (var _i = 0, canvases_1 = canvases; _i < canvases_1.length; _i++) {
            var canvas = canvases_1[_i];
            var annotations = canvas.getContent();
            for (var _a = 0, annotations_1 = annotations; _a < annotations_1.length; _a++) {
                var annotation = annotations_1[_a];
                var annotationBody = extractMediaFromAnnotationBodies(annotation);
                if (!annotationBody)
                    continue;
                var mediaSource = getMediaSourceFromAnnotationBody(annotation, annotationBody, {
                    id: canvas.id,
                    duration: canvas.getDuration() || 0,
                    height: canvas.getHeight(),
                    width: canvas.getWidth(),
                });
                var mediaElement = new MediaElement(mediaSource, {
                    adaptiveAuthEnabled: this._data.adaptiveAuthEnabled,
                });
                mediaElement.setSize(this._convertToPercentage(mediaSource.x || 0, canvas.getHeight()), this._convertToPercentage(mediaSource.y || 0, canvas.getWidth()), this._convertToPercentage(mediaSource.width || canvas.getWidth(), canvas.getWidth()), this._convertToPercentage(mediaSource.height || canvas.getHeight(), canvas.getHeight()));
                mediaElements.push(mediaElement);
                var seeAlso = annotation.getProperty('seeAlso');
                if (seeAlso && seeAlso.length) {
                    var dat = seeAlso[0].id;
                    this.waveforms.push(dat);
                }
            }
        }
        var compositeMediaElement = new CompositeMediaElement(mediaElements);
        compositeMediaElement.appendTo(this.$playerElement);
        compositeMediaElement.load().then(function () {
            // this._updateDurationDisplay();
            _this.fire(Events.MEDIA_READY);
        });
        // this._renderSyncIndicator(data)
        var plan = createTimePlansFromManifest(helper.manifest, mediaElements);
        // @ts-ignore
        window.timePlanPlayer = this.timePlanPlayer = new TimePlanPlayer(compositeMediaElement, plan, function (rangeId) {
            _this.setCurrentRangeId(rangeId, { autoChanged: true });
        }, function (time) {
            _this._canvasClockTime = time;
        }, function (isPlaying) {
            if (isPlaying) {
                _this.play();
            }
            else {
                _this.pause();
            }
        });
    };
    CanvasInstance.prototype.init = function () {
        var _this = this;
        if (!this._data || !this._data.content || !this._data.canvas) {
            console.warn('unable to initialise, missing canvas or content');
            return;
        }
        this._$hoverPreviewTemplate = $('<div class="hover-preview"><div class="label"></div><div class="pointer"><span class="arrow"></span></div></div>');
        this._$canvasContainer = $('<div class="canvas-container"></div>');
        this._$optionsContainer = $('<div class="options-container"></div>');
        this._$rangeTimelineContainer = $('<div class="range-timeline-container"></div>');
        this._$canvasTimelineContainer = $('<div class="canvas-timeline-container"></div>');
        this._$canvasHoverPreview = this._$hoverPreviewTemplate.clone();
        this._$canvasHoverHighlight = $('<div class="hover-highlight"></div>');
        this._$rangeHoverPreview = this._$hoverPreviewTemplate.clone();
        this._$rangeHoverHighlight = $('<div class="hover-highlight"></div>');
        this._$durationHighlight = $('<div class="duration-highlight"></div>');
        this._$timelineItemContainer = $('<div class="timeline-item-container"></div>');
        this._$controlsContainer = $('<div class="controls-container"></div>');
        this._$prevButton = $("\n                                <button class=\"btn\" title=\"" + this._data.content.previous + "\">\n                                    <i class=\"av-icon av-icon-previous\" aria-hidden=\"true\"></i>" + this._data.content.previous + "\n                                </button>");
        this._$playButton = $("\n                                <button class=\"btn\" title=\"" + this._data.content.play + "\">\n                                    <i class=\"av-icon av-icon-play play\" aria-hidden=\"true\"></i>" + this._data.content.play + "\n                                </button>");
        this._$nextButton = $("\n                                <button class=\"btn\" title=\"" + this._data.content.next + "\">\n                                    <i class=\"av-icon av-icon-next\" aria-hidden=\"true\"></i>" + this._data.content.next + "\n                                </button>");
        this._$fastForward = $("\n                                <button class=\"btn\" title=\"" + this._data.content.next + "\">\n                                    <i class=\"av-icon av-icon-fast-forward\" aria-hidden=\"true\"></i>" + (this._data.content.fastForward || '') + "\n                                </button>");
        this._$fastRewind = $("\n                                <button class=\"btn\" title=\"" + this._data.content.next + "\">\n                                    <i class=\"av-icon av-icon-fast-rewind\" aria-hidden=\"true\"></i>" + (this._data.content.fastRewind || '') + "\n                                </button>");
        this._$timeDisplay = $('<div class="time-display"><span class="canvas-time"></span> / <span class="canvas-duration"></span></div>');
        this._$canvasTime = this._$timeDisplay.find('.canvas-time');
        this._$canvasDuration = this._$timeDisplay.find('.canvas-duration');
        if (this.isVirtual()) {
            this.$playerElement.addClass('virtual');
        }
        var $volume = $('<div class="volume"></div>');
        this._volume = new AVVolumeControl({
            target: $volume[0],
            data: Object.assign({}, this._data),
        });
        this._volume.on(VolumeEvents.VOLUME_CHANGED, function (value) {
            _this.fire(VolumeEvents.VOLUME_CHANGED, value);
        }, false);
        // @todo make the buttons for FF and FR configurable.
        this._$controlsContainer.append(this._$prevButton, this._data.enableFastRewind ? this._$fastRewind : null, this._$playButton, this._data.enableFastForward ? this._$fastForward : null, this._$nextButton, this._$timeDisplay, $volume);
        this._$canvasTimelineContainer.append(this._$canvasHoverPreview, this._$canvasHoverHighlight, this._$durationHighlight);
        this._$rangeTimelineContainer.append(this._$rangeHoverPreview, this._$rangeHoverHighlight);
        this._$optionsContainer.append(this._$canvasTimelineContainer, this._$rangeTimelineContainer, this._$controlsContainer);
        this.$playerElement.append(this._$canvasContainer, this._$optionsContainer);
        this._$canvasHoverPreview.hide();
        this._$rangeHoverPreview.hide();
        var newRanges = this.isVirtual() && AVComponent.newRanges;
        // Should bootstrap ranges and content.
        if (newRanges) {
            this.createTimeStops();
        }
        if (!newRanges) {
            if (this._data && this._data.helper && this._data.canvas) {
                var ranges_1 = [];
                // if the canvas is virtual, get the ranges for all sub canvases
                if (isVirtual(this._data.canvas)) {
                    this._data.canvas.canvases.forEach(function (canvas) {
                        if (_this._data && _this._data.helper) {
                            var r = _this._data.helper.getCanvasRanges(canvas);
                            var clonedRanges_1 = [];
                            // shift the range targets forward by the duration of their previous canvases
                            r.forEach(function (range) {
                                var clonedRange = jQuery.extend(true, {}, range);
                                clonedRanges_1.push(clonedRange);
                                if (clonedRange.canvases && clonedRange.canvases.length) {
                                    for (var i = 0; i < clonedRange.canvases.length; i++) {
                                        if (isVirtual(_this._data.canvas)) {
                                            clonedRange.canvases[i] = retargetTemporalComponent(_this._data.canvas.canvases, clonedRange.__jsonld.items[i].id);
                                        }
                                    }
                                }
                            });
                            ranges_1.push.apply(ranges_1, clonedRanges_1);
                        }
                    });
                }
                else {
                    ranges_1 = ranges_1.concat(this._data.helper.getCanvasRanges(this._data.canvas));
                }
                ranges_1.forEach(function (range) {
                    _this.ranges.push(range);
                });
            }
        }
        var canvasWidth = this._data.canvas.getWidth();
        var canvasHeight = this._data.canvas.getHeight();
        if (!canvasWidth) {
            this._canvasWidth = this.$playerElement.parent().width(); // this._data.defaultCanvasWidth;
        }
        else {
            this._canvasWidth = canvasWidth;
        }
        if (!canvasHeight) {
            this._canvasHeight = this._canvasWidth * (this._data.defaultAspectRatio || 1); //this._data.defaultCanvasHeight;
        }
        else {
            this._canvasHeight = canvasHeight;
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        var that = this;
        var prevClicks = 0;
        var prevTimeout = 0;
        this._$prevButton.on('touchstart click', function (e) {
            e.preventDefault();
            prevClicks++;
            if (prevClicks === 1) {
                // single click
                _this._previous(false);
                prevTimeout = setTimeout(function () {
                    prevClicks = 0;
                    prevTimeout = 0;
                }, _this._data.doubleClickMS);
            }
            else {
                // double click
                _this._previous(true);
                clearTimeout(prevTimeout);
                prevClicks = 0;
                prevTimeout = 0;
            }
        });
        this._$playButton.on('touchstart click', function (e) {
            e.preventDefault();
            if (_this._isPlaying) {
                _this.pause();
            }
            else {
                _this.play();
            }
        });
        this._$nextButton.on('touchstart click', function (e) {
            e.preventDefault();
            _this._next();
        });
        this._$fastForward.on('touchstart click', function (e) {
            var end = _this.getRangeTiming().end;
            var goToTime = _this.getClockTime() + 20;
            if (goToTime < end) {
                return _this._setCurrentTime(goToTime);
            }
            return _this._setCurrentTime(end);
        });
        this._$fastRewind.on('touchstart click', function (e) {
            var start = _this.getRangeTiming().start;
            var goToTime = _this.getClockTime() - 20;
            if (goToTime >= start) {
                return _this._setCurrentTime(goToTime);
            }
            return _this._setCurrentTime(start);
        });
        if (newRanges) {
            this._$canvasTimelineContainer.slider({
                value: 0,
                step: 0.01,
                orientation: 'horizontal',
                range: 'min',
                min: 0,
                max: this.timePlanPlayer.getDuration(),
                animate: false,
                slide: function (evt, ui) {
                    _this._setCurrentTime(_this.timePlanPlayer.plan.start + ui.value);
                },
            });
        }
        else {
            this._$canvasTimelineContainer.slider({
                value: 0,
                step: 0.01,
                orientation: 'horizontal',
                range: 'min',
                max: that._getDuration(),
                animate: false,
                create: function (evt, ui) {
                    // on create
                },
                slide: function (evt, ui) {
                    that._setCurrentTime(ui.value);
                },
                stop: function (evt, ui) {
                    //this._setCurrentTime(ui.value);
                },
            });
        }
        this._$canvasTimelineContainer.mouseout(function () {
            that._$canvasHoverHighlight.width(0);
            that._$canvasHoverPreview.hide();
        });
        this._$rangeTimelineContainer.mouseout(function () {
            that._$rangeHoverHighlight.width(0);
            that._$rangeHoverPreview.hide();
        });
        this._$canvasTimelineContainer.on('mousemove', function (e) {
            if (newRanges) {
                _this._updateHoverPreview(e, _this._$canvasTimelineContainer, _this.timePlanPlayer.getDuration());
            }
            else {
                _this._updateHoverPreview(e, _this._$canvasTimelineContainer, _this._getDuration());
            }
        });
        this._$rangeTimelineContainer.on('mousemove', function (e) {
            if (newRanges) {
                _this._updateHoverPreview(e, _this._$canvasTimelineContainer, _this.timePlanPlayer.getDuration());
            }
            else if (_this._data.range) {
                var duration = _this._data.range.getDuration();
                _this._updateHoverPreview(e, _this._$rangeTimelineContainer, duration ? duration.getLength() : 0);
            }
        });
        if (newRanges) {
            return;
        }
        // create annotations
        this._contentAnnotations = [];
        var items = this._data.canvas.getContent(); // (<any>this._data.canvas).__jsonld.content[0].items;
        // always hide timelineItemContainer for now
        //if (items.length === 1) {
        this._$timelineItemContainer.hide();
        //}
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            /*
                    if (item.motivation != 'painting') {
                        return null;
                    }
                    */
            var mediaSource = void 0;
            var bodies = item.getBody();
            if (!bodies.length) {
                console.warn('item has no body');
                return;
            }
            var body = this._getBody(bodies);
            if (!body) {
                // if no suitable format was found for the current browser, skip this item.
                console.warn('unable to find suitable format for', item.id);
                continue;
            }
            var type = body.getType();
            var format = body.getFormat();
            // if (type && type.toString() === 'choice') {
            //     // Choose first "Choice" item as body
            //     const tmpItem = item;
            //     item.body = tmpItem.body[0].items[0];
            //     mediaSource = item.body.id.split('#')[0];
            // } else
            if (type && type.toString() === 'textualbody') {
                //mediaSource = (<any>body).value;
            }
            else {
                mediaSource = body.id.split('#')[0];
            }
            /*
                    var targetFragment = (item.target.indexOf('#') != -1) ? item.target.split('#t=')[1] : '0, '+ canvasClockDuration,
                        fragmentTimings = targetFragment.split(','),
                        startTime = parseFloat(fragmentTimings[0]),
                        endTime = parseFloat(fragmentTimings[1]);
      
                    //TODO: Check format (in "target" as MFID or in "body" as "width", "height" etc.)
                    var fragmentPosition = [0, 0, 100, 100],
                        positionTop = fragmentPosition[1],
                        positionLeft = fragmentPosition[0],
                        mediaWidth = fragmentPosition[2],
                        mediaHeight = fragmentPosition[3];
                    */
            var target = item.getTarget();
            if (!target) {
                console.warn('item has no target');
                return;
            }
            var xywh = getSpatialComponent(target);
            var t = Utils.getTemporalComponent(target);
            if (!xywh) {
                xywh = [0, 0, this._canvasWidth, this._canvasHeight];
            }
            if (!t) {
                t = [0, this._getDuration()];
            }
            var positionLeft = parseInt(String(xywh[0])), positionTop = parseInt(String(xywh[1])), mediaWidth = parseInt(String(xywh[2])), mediaHeight = parseInt(String(xywh[3])), startTime = parseInt(String(t[0])), endTime = parseInt(String(t[1]));
            var percentageTop = this._convertToPercentage(positionTop, this._canvasHeight), percentageLeft = this._convertToPercentage(positionLeft, this._canvasWidth), percentageWidth = this._convertToPercentage(mediaWidth, this._canvasWidth), percentageHeight = this._convertToPercentage(mediaHeight, this._canvasHeight);
            var temporalOffsets = /t=([^&]+)/g.exec(body.id);
            var ot = void 0;
            if (temporalOffsets && temporalOffsets[1]) {
                ot = temporalOffsets[1].split(',');
            }
            else {
                ot = [null, null];
            }
            var offsetStart = ot[0] ? parseInt(ot[0]) : ot[0], offsetEnd = ot[1] ? parseInt(ot[1]) : ot[1];
            // todo: type this
            var itemData = {
                active: false,
                end: endTime,
                endOffset: offsetEnd,
                format: format,
                height: percentageHeight,
                left: percentageLeft,
                source: mediaSource,
                start: startTime,
                startOffset: offsetStart,
                top: percentageTop,
                type: type,
                width: percentageWidth,
            };
            this._renderMediaElement(itemData);
            // waveform
            // todo: create annotation.getSeeAlso
            var seeAlso = item.getProperty('seeAlso');
            if (seeAlso && seeAlso.length) {
                var dat = seeAlso[0].id;
                this.waveforms.push(dat);
            }
        }
    };
    CanvasInstance.prototype._getBody = function (bodies) {
        // if there's an HLS format and HLS is supported in this browser
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            var format = body.getFormat();
            if (format) {
                if (isHLSFormat(format) && canPlayHls()) {
                    return body;
                }
            }
        }
        // if there's a Dash format and the browser isn't Safari
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            var format = body.getFormat();
            if (format) {
                if (isMpegDashFormat(format) && !isSafari()) {
                    return body;
                }
            }
        }
        // otherwise, return the first format that isn't HLS or Dash
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            var format = body.getFormat();
            if (format) {
                if (!isHLSFormat(format) && !isMpegDashFormat(format)) {
                    return body;
                }
            }
        }
        // couldn't find a suitable format
        return null;
    };
    CanvasInstance.prototype._getDuration = function () {
        if (this.isVirtual() && AVComponent.newRanges) {
            return this.timePlanPlayer.getDuration();
        }
        if (this._data && this._data.canvas) {
            return Math.floor(this._data.canvas.getDuration());
        }
        return 0;
    };
    CanvasInstance.prototype.data = function () {
        return {
            waveformColor: '#fff',
            waveformBarSpacing: 4,
            waveformBarWidth: 2,
            volume: 1,
        };
    };
    /**
     * @deprecated
     */
    CanvasInstance.prototype.isVirtual = function () {
        return this._data.canvas instanceof VirtualCanvas;
    };
    CanvasInstance.prototype.isVisible = function () {
        return !!this._data.visible;
    };
    CanvasInstance.prototype.includesVirtualSubCanvas = function (canvasId) {
        if (isVirtual(this._data.canvas) && this._data.canvas && this._data.canvas.canvases) {
            for (var i = 0; i < this._data.canvas.canvases.length; i++) {
                var canvas = this._data.canvas.canvases[i];
                if (Utils.normaliseUrl(canvas.id) === canvasId) {
                    return true;
                }
            }
        }
        return false;
    };
    CanvasInstance.prototype.setVisibility = function (visibility) {
        if (this._data.visible === visibility) {
            return;
        }
        this._data.visible = visibility;
        if (visibility) {
            this._rewind();
            this.$playerElement.show();
        }
        else {
            this.$playerElement.hide();
            this.pause();
        }
        this.resize();
    };
    CanvasInstance.prototype.viewRange = function (rangeId) {
        if (this.currentRange !== rangeId) {
            console.log("Switching range from " + this.currentRange + " to " + rangeId);
            this.setCurrentRangeId(rangeId);
            // Entrypoint for changing a range. Only get's called when change came from external source.
            this._setCurrentTime(this.timePlanPlayer.setRange(rangeId), true);
            this._render();
        }
    };
    CanvasInstance.prototype.setCurrentRangeId = function (range, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.autoChanged, autoChanged = _c === void 0 ? false : _c, _d = _b.limitToRange, limitToRange = _d === void 0 ? false : _d;
        if (!this.currentRange && range && this.limitToRange) {
            // @todo which case was this covering..
            //this.limitToRange = false;
        }
        console.log('Setting current range id', range);
        // This is the end of the chain for changing a range.
        if (range && this.currentRange !== range) {
            this.currentRange = range;
            this.fire(Events.RANGE_CHANGED, range);
        }
        else if (range === null) {
            this.currentRange = undefined;
            this.fire(Events.RANGE_CHANGED, null);
        }
        this._render();
    };
    CanvasInstance.prototype.setVolume = function (volume) {
        this._volume.set({ volume: volume });
        this.timePlanPlayer.setVolume(volume);
    };
    CanvasInstance.prototype.setLimitToRange = function (limitToRange) {
        console.log(this._data.constrainNavigationToRange);
        if (this.limitToRange !== limitToRange) {
            this.limitToRange = limitToRange;
            this._render();
        }
    };
    CanvasInstance.prototype.set = function (data) {
        var _this = this;
        // Simplification of setting state.
        if (AVComponent.newRanges && this.isVirtual()) {
            if (typeof data.range !== 'undefined')
                this.setCurrentRangeId(data.range.id, {
                    limitToRange: data.limitToRange,
                });
            if (typeof data.rangeId !== 'undefined')
                this.setCurrentRangeId(data.rangeId, {
                    limitToRange: data.limitToRange,
                });
            if (typeof data.volume !== 'undefined')
                this.setVolume(data.volume);
            if (typeof data.limitToRange !== 'undefined')
                this.setLimitToRange(data.limitToRange);
            if (typeof data.visible !== 'undefined')
                this.setVisibility(data.visible);
            return;
        }
        var oldData = Object.assign({}, this._data);
        this._data = Object.assign(this._data, data);
        var diff = diffData(oldData, this._data);
        if (diff.includes('visible')) {
            if (this._data.canvas) {
                if (this._data.visible) {
                    this._rewind();
                    this.$playerElement.show();
                }
                else {
                    this.$playerElement.hide();
                    this.pause();
                }
                this.resize();
            }
        }
        if (diff.includes('range')) {
            if (this._data.helper) {
                if (!this._data.range) {
                    this.fire(Events.RANGE_CHANGED, null);
                }
                else {
                    var duration = this._data.range.getDuration();
                    if (duration) {
                        if (typeof duration !== 'undefined') {
                            // Only change the current time if the current time is outside of the current time.
                            if (duration.start >= this._canvasClockTime || duration.end <= this._canvasClockTime) {
                                this._setCurrentTime(duration.start);
                            }
                            if (this._data.autoPlay) {
                                this.play();
                            }
                            this.fire(Events.RANGE_CHANGED, this._data.range.id, this._data.range);
                        }
                    }
                }
            }
            if (diff.includes('volume')) {
                this._contentAnnotations.forEach(function ($mediaElement) {
                    var volume = _this._data.volume !== undefined ? _this._data.volume : 1;
                    $($mediaElement.element).prop('volume', volume);
                    _this._volume.set({
                        volume: _this._data.volume,
                    });
                });
            }
            else {
                if (this.isVisible()) {
                    this._render();
                }
            }
            if (diff.includes('limitToRange')) {
                this._render();
            }
        }
    };
    CanvasInstance.prototype._hasRangeChanged = function () {
        if (this.isVirtual() && AVComponent.newRanges) {
            return;
        }
        var range = this._getRangeForCurrentTime();
        if (range &&
            !this._data.limitToRange &&
            (!this._data.range || (this._data.range && range.id !== this._data.range.id))) {
            console.log('Did you change the range?', range);
            this.set({
                range: jQuery.extend(true, { autoChanged: true }, range),
            });
        }
    };
    CanvasInstance.prototype._getRangeForCurrentTime = function (parentRange) {
        var ranges;
        if (!parentRange) {
            ranges = this.ranges;
        }
        else {
            ranges = parentRange.getRanges();
        }
        for (var i = 0; i < ranges.length; i++) {
            var range = ranges[i];
            var rangeBehavior = range.getBehavior();
            if (rangeBehavior && rangeBehavior !== 'no-nav') {
                continue;
            }
            // if the range spans the current time, and is navigable, return it.
            // otherwise, try to find a navigable child range.
            if (this._rangeSpansCurrentTime(range)) {
                if (this._rangeNavigable(range)) {
                    return range;
                }
                var childRanges = range.getRanges();
                // if a child range spans the current time, recurse into it
                for (var j = 0; j < childRanges.length; j++) {
                    var childRange = childRanges[j];
                    if (this._rangeSpansCurrentTime(childRange)) {
                        return this._getRangeForCurrentTime(childRange);
                    }
                }
                // this range isn't navigable, and couldn't find a navigable child range.
                // therefore return the parent range (if any).
                return range.parentRange;
            }
        }
        return undefined;
    };
    CanvasInstance.prototype._rangeSpansCurrentTime = function (range) {
        if (range.spansTime(Math.ceil(this._canvasClockTime) + this._rangeSpanPadding)) {
            return true;
        }
        return false;
    };
    CanvasInstance.prototype._rangeNavigable = function (range) {
        var behavior = range.getBehavior();
        if (behavior && behavior.toString() === 'no-nav') {
            return false;
        }
        return true;
    };
    CanvasInstance.prototype._render = function () {
        if (this.isVirtual() && AVComponent.newRanges && this.isVisible()) {
            console.groupCollapsed('Rendering a new range!');
            console.log({
                dataRange: this._data.rangeId,
                range: this.currentRange,
                newLimitToRange: this.limitToRange,
                constraintToRange: this._data.constrainNavigationToRange,
                autoSelectRange: this._data.autoSelectRange,
            });
            // 3 ways to render:
            // Limit to range + no id = show everything
            // Limit to range + id = show everything in context
            // No limit to range = show everything
            // No limit -> Limit (+ range) = show just range
            // - Range id + limitToRange
            // - Range id
            // - nothing
            if (this.limitToRange && this.currentRange) {
                console.log('Selecting plan...', this.currentRange);
                this.timePlanPlayer.selectPlan({ rangeId: this.currentRange });
            }
            else {
                console.log('Resetting...');
                this.timePlanPlayer.selectPlan({ reset: true });
            }
            var ratio = this._$canvasTimelineContainer.width() / this.timePlanPlayer.getDuration();
            this._$durationHighlight.show();
            var _a = this.timePlanPlayer.getCurrentRange(), start = _a.start, duration = _a.duration;
            this._$canvasTimelineContainer.slider({
                value: this._canvasClockTime - this.timePlanPlayer.plan.start,
                max: this.timePlanPlayer.getDuration(),
            });
            // set the start position and width
            this._$durationHighlight.css({
                left: start * ratio,
                width: duration * ratio,
            });
            console.groupEnd();
            this._updateCurrentTimeDisplay();
            this._updateDurationDisplay();
            this._drawWaveform();
            return;
        }
        // Hide/show UI elements regardless of visibility.
        if (this._data.limitToRange && this._data.range) {
            this._$canvasTimelineContainer.hide();
            this._$rangeTimelineContainer.show();
        }
        else {
            this._$canvasTimelineContainer.show();
            this._$rangeTimelineContainer.hide();
        }
        if (!this._data.range) {
            this._$durationHighlight.hide();
        }
        // Return early if the current CanvasInstance isn't visible
        if (!this.isVisible()) {
            return;
        }
        if (!this.isOnlyCanvasInstance && !this.isVirtual()) {
            return;
        }
        // Render otherwise.
        if (this._data.range && !(this.isVirtual() && AVComponent.newRanges)) {
            var duration = this._data.range.getDuration();
            if (duration) {
                // get the total length in seconds.
                var totalDuration = this._getDuration();
                // get the length of the timeline container
                var timelineLength = this._$canvasTimelineContainer.width();
                // get the ratio of seconds to length
                var ratio = timelineLength / totalDuration;
                var totalLength = totalDuration * ratio;
                var start = duration.start * ratio;
                var end = duration.end * ratio;
                // if the end is on the next canvas
                if (end > totalLength || end < start) {
                    end = totalLength;
                }
                var width = end - start;
                if (this.isVirtual() || this.isOnlyCanvasInstance) {
                    this._$durationHighlight.show();
                    // set the start position and width
                    this._$durationHighlight.css({
                        left: start,
                        width: width,
                    });
                }
                else {
                    this._$durationHighlight.hide();
                }
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                var that_1 = this;
                // try to destroy existing rangeTimelineContainer
                if (this._$rangeTimelineContainer.data('ui-sortable')) {
                    this._$rangeTimelineContainer.slider('destroy');
                }
                this._$rangeTimelineContainer.slider({
                    value: duration.start,
                    step: 0.01,
                    orientation: 'horizontal',
                    range: 'min',
                    min: duration.start,
                    max: duration.end,
                    animate: false,
                    create: function (evt, ui) {
                        // on create
                    },
                    slide: function (evt, ui) {
                        that_1._setCurrentTime(ui.value);
                    },
                    stop: function (evt, ui) {
                        //this._setCurrentTime(ui.value);
                    },
                });
            }
        }
        this._updateCurrentTimeDisplay();
        this._updateDurationDisplay();
        this._drawWaveform();
    };
    CanvasInstance.prototype.getCanvasId = function () {
        if (this._data && this._data.canvas) {
            return this._data.canvas.id;
        }
        return undefined;
    };
    CanvasInstance.prototype._updateHoverPreview = function (e, $container, duration) {
        var offset = $container.offset();
        var x = e.pageX - offset.left;
        var $hoverArrow = $container.find('.arrow');
        var $hoverHighlight = $container.find('.hover-highlight');
        var $hoverPreview = $container.find('.hover-preview');
        $hoverHighlight.width(x);
        var fullWidth = $container.width();
        var ratio = x / fullWidth;
        var seconds = Math.min(duration * ratio);
        $hoverPreview.find('.label').text(formatTime(seconds));
        var hoverPreviewWidth = $hoverPreview.outerWidth();
        var hoverPreviewHeight = $hoverPreview.outerHeight();
        var left = x - hoverPreviewWidth * 0.5;
        var arrowLeft = hoverPreviewWidth * 0.5 - 6;
        if (left < 0) {
            left = 0;
            arrowLeft = x - 6;
        }
        if (left + hoverPreviewWidth > fullWidth) {
            left = fullWidth - hoverPreviewWidth;
            arrowLeft = hoverPreviewWidth - (fullWidth - x) - 6;
        }
        $hoverPreview
            .css({
            left: left,
            top: hoverPreviewHeight * -1 + 'px',
        })
            .show();
        $hoverArrow.css({
            left: arrowLeft,
        });
    };
    CanvasInstance.prototype._previous = function (isDouble) {
        if (AVComponent.newRanges && this.isVirtual()) {
            console.groupCollapsed('prev');
            var newTime = this.timePlanPlayer.previous();
            this._setCurrentTime(newTime);
            console.log('new time -> ', newTime);
            console.groupEnd();
            return;
        }
        if (this._data.limitToRange) {
            // if only showing the range, single click rewinds, double click goes to previous range unless navigation is contrained to range
            if (isDouble) {
                if (this._isNavigationConstrainedToRange()) {
                    this._rewind();
                }
                else {
                    this.fire(CanvasInstanceEvents.PREVIOUS_RANGE);
                }
            }
            else {
                this._rewind();
            }
        }
        else {
            // not limited to range.
            // if there is a currentDuration, single click goes to previous range, double click clears current duration and rewinds.
            // if there is no currentDuration, single and double click rewinds.
            if (this._data.range) {
                if (isDouble) {
                    this.set({
                        range: undefined,
                    });
                    this._rewind();
                }
                else {
                    this.fire(CanvasInstanceEvents.PREVIOUS_RANGE);
                }
            }
            else {
                this._rewind();
            }
        }
    };
    CanvasInstance.prototype._next = function () {
        if (AVComponent.newRanges && this.isVirtual()) {
            console.groupCollapsed('next');
            this._setCurrentTime(this.timePlanPlayer.next(), false);
            console.groupEnd();
            return;
        }
        if (this._data.limitToRange) {
            if (this._isNavigationConstrainedToRange()) {
                this._fastforward();
            }
            else {
                this.fire(CanvasInstanceEvents.NEXT_RANGE);
            }
        }
        else {
            this.fire(CanvasInstanceEvents.NEXT_RANGE);
        }
    };
    CanvasInstance.prototype.destroy = function () {
        window.clearInterval(this._highPriorityInterval);
        window.clearInterval(this._lowPriorityInterval);
        window.clearInterval(this._canvasClockInterval);
    };
    CanvasInstance.prototype._convertToPercentage = function (pixelValue, maxValue) {
        var percentage = (pixelValue / maxValue) * 100;
        return percentage;
    };
    CanvasInstance.prototype._renderMediaElement = function (data) {
        var _this = this;
        var $mediaElement;
        var type = data.type.toString().toLowerCase();
        switch (type) {
            case 'video':
                $mediaElement = $('<video crossorigin="anonymous" class="anno" />');
                break;
            case 'sound':
            case 'audio':
                $mediaElement = $('<audio crossorigin="anonymous" class="anno" />');
                break;
            // case 'textualbody':
            //     $mediaElement = $('<div class="anno">' + data.source + '</div>');
            //     break;
            // case 'image':
            //     $mediaElement = $('<img class="anno" src="' + data.source + '" />');
            //     break;
            default:
                return;
        }
        var media = $mediaElement[0];
        //
        // var audioCtx = new AudioContext();
        // var source = audioCtx.createMediaElementSource(media);
        // var panNode = audioCtx.createStereoPanner();
        // var val = -1;
        // setInterval(() => {
        //     val = val === -1 ? 1 : -1;
        //     panNode.pan.setValueAtTime(val, audioCtx.currentTime);
        //     if (val === 1) {
        //         media.playbackRate = 2;
        //     } else {
        //         // media.playbackRate = 1;
        //     }
        // }, 1000);
        // source.connect(panNode);
        // panNode.connect(audioCtx.destination);
        if (data.format && data.format.toString() === 'application/dash+xml') {
            // dash
            $mediaElement.attr('data-dashjs-player', '');
            var player = dashjs.MediaPlayer().create();
            player.getDebug().setLogToBrowserConsole(false);
            // player.getDebug().setLogToBrowserConsole(true);
            // player.getDebug().setLogLevel(4);
            if (this._data.adaptiveAuthEnabled) {
                player.setXHRWithCredentialsForType('MPD', true); // send cookies
            }
            player.initialize(media, data.source);
        }
        else if (data.format && data.format.toString() === 'application/vnd.apple.mpegurl') {
            // hls
            if (Hls.isSupported()) {
                var hls = new Hls();
                if (this._data.adaptiveAuthEnabled) {
                    hls = new Hls({
                        xhrSetup: function (xhr) {
                            xhr.withCredentials = true; // send cookies
                        },
                    });
                }
                else {
                    hls = new Hls();
                }
                if (this._data.adaptiveAuthEnabled) {
                    // no-op.
                }
                hls.loadSource(data.source);
                hls.attachMedia(media);
                //hls.on(Hls.Events.MANIFEST_PARSED, function () {
                //media.play();
                //});
            }
            else if (media.canPlayType('application/vnd.apple.mpegurl')) {
                // hls.js is not supported on platforms that do not have Media Source Extensions (MSE) enabled.
                // When the browser has built-in HLS support (check using `canPlayType`), we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video element throught the `src` property.
                // This is using the built-in support of the plain video element, without using hls.js.
                media.src = data.source;
                //media.addEventListener('canplay', function () {
                //media.play();
                //});
            }
        }
        else {
            $mediaElement.attr('src', data.source);
        }
        $mediaElement
            .css({
            top: data.top + '%',
            left: data.left + '%',
            width: data.width + '%',
            height: data.height + '%',
        })
            .hide();
        data.element = $mediaElement;
        data.timeout = null;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        var that = this;
        data.checkForStall = function () {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            var self = this;
            if (this.active) {
                that._checkMediaSynchronization();
                if (this.element.get(0).readyState > 0 && !this.outOfSync) {
                    that._playbackStalled(false, self);
                }
                else {
                    that._playbackStalled(true, self);
                    if (this.timeout) {
                        window.clearTimeout(this.timeout);
                    }
                    this.timeout = window.setTimeout(function () {
                        self.checkForStall();
                    }, 1000);
                }
            }
            else {
                that._playbackStalled(false, self);
            }
        };
        this._contentAnnotations.push(data);
        if (this.$playerElement) {
            this._$canvasContainer.append($mediaElement);
        }
        $mediaElement.on('loadedmetadata', function () {
            _this._readyMediaCount++;
            if (_this._readyMediaCount === _this._contentAnnotations.length) {
                if (_this._data.autoPlay) {
                    _this.play();
                }
                else {
                    _this.pause();
                }
                _this._updateDurationDisplay();
                _this.fire(Events.MEDIA_READY);
            }
        });
        $mediaElement.attr('preload', 'metadata');
        // @todo why?
        $mediaElement.get(0).load();
        this._renderSyncIndicator(data);
    };
    CanvasInstance.prototype._getWaveformData = function (url) {
        // return new Promise(function (resolve, reject) {
        //     const xhr = new XMLHttpRequest();
        //     xhr.responseType = 'arraybuffer';
        //     xhr.open('GET', url);
        //     xhr.addEventListener('load', (progressEvent: any) => {
        //         if (xhr.status == 200) {
        //             resolve(WaveformData.create(progressEvent.target.response));
        //         } else {
        //             reject(new Error(xhr.statusText));
        //         }
        //     });
        //     xhr.onerror = function () {
        //         reject(new Error("Network Error"));
        //     };
        //     xhr.send();
        // });
        // must use this for IE11
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'binary',
                responseType: 'arraybuffer',
                processData: false,
            })
                .done(function (data) {
                resolve(WaveformData.create(data));
            })
                .fail(function () {
                reject(new Error('Network Error'));
            });
        });
    };
    CanvasInstance.prototype._renderWaveform = function (forceRender) {
        var _this = this;
        if (forceRender === void 0) { forceRender = false; }
        if (this.waveFormInit && !forceRender) {
            return;
        }
        this.waveFormInit = true;
        if (!this.waveforms.length)
            return;
        var promises = this.waveforms.map(function (url) {
            return _this._getWaveformData(url);
        });
        Promise.all(promises)
            .then(function (waveforms) {
            _this._waveformCanvas = document.createElement('canvas');
            _this._waveformCanvas.classList.add('waveform');
            _this._$canvasContainer.append(_this._waveformCanvas);
            _this.waveformPageX = _this._waveformCanvas.getBoundingClientRect().left;
            var raf = _this._drawWaveform.bind(_this);
            // Mouse in and out we reset the delta
            _this._waveformCanvas.addEventListener('mousein', function () {
                _this.waveformDeltaX = 0;
            });
            _this._$canvasTimelineContainer.on('mouseout', function () {
                _this.waveformDeltaX = 0;
                requestAnimationFrame(raf);
            });
            _this._waveformCanvas.addEventListener('mouseout', function () {
                _this.waveformDeltaX = 0;
                requestAnimationFrame(raf);
            });
            // When mouse moves over waveform, we render
            _this._waveformCanvas.addEventListener('mousemove', function (e) {
                _this.waveformDeltaX = e.clientX - _this.waveformPageX;
                requestAnimationFrame(raf);
            });
            _this._$canvasTimelineContainer.on('mousemove', function (e) {
                _this.waveformDeltaX = e.clientX - _this.waveformPageX;
                requestAnimationFrame(raf);
            });
            // When we click the waveform, it should navigate
            _this._waveformCanvas.addEventListener('click', function () {
                var width = _this._waveformCanvas.getBoundingClientRect().width || 0;
                if (width) {
                    var _a = _this.getRangeTiming(), start = _a.start, duration = _a.duration;
                    _this._setCurrentTime(start + duration * (_this.waveformDeltaX / width));
                }
            });
            _this._waveformCtx = _this._waveformCanvas.getContext('2d');
            if (_this._waveformCtx) {
                _this._waveformCtx.fillStyle = _this._data.waveformColor || '#fff';
                _this._compositeWaveform = new CompositeWaveform(waveforms);
                _this.fire(Events.WAVEFORM_READY);
            }
        })
            .catch(function () {
            console.warn('Could not load wave forms.');
        });
    };
    CanvasInstance.prototype.getRangeTiming = function () {
        if (AVComponent.newRanges && this.isVirtual()) {
            return {
                start: this.timePlanPlayer.plan.start,
                end: this.timePlanPlayer.plan.end,
                duration: this.timePlanPlayer.plan.duration,
                percent: Math.min((this.timePlanPlayer.getTime() - this.timePlanPlayer.plan.start) / this.timePlanPlayer.plan.duration, 1),
            };
        }
        var durationObj;
        var start = 0;
        var end = this._compositeWaveform ? this._compositeWaveform.duration : -1;
        var duration = end;
        // This is very similar to
        if (this._data.range) {
            durationObj = this._data.range.getDuration();
        }
        if (!this.isVirtual()) {
            end = this._getDuration();
        }
        if (this._data.limitToRange && durationObj) {
            start = durationObj.start;
            end = durationObj.end;
            duration = end - start;
        }
        if (end === -1 && durationObj) {
            start = durationObj.start;
            end = durationObj.end;
            duration = end - start;
        }
        if (end === -1) {
            console.log('getRangeTiming', { start: start, end: end, duration: duration, durationObj: durationObj });
            console.log('Duration not found...');
        }
        return {
            start: start,
            end: end,
            duration: end - start,
            percent: Math.min((this.getClockTime() - start) / duration, 1),
        };
    };
    CanvasInstance.prototype._drawWaveform = function () {
        this._renderWaveform();
        //if (!this._waveformCtx || !this._waveformNeedsRedraw) return;
        if (!this._waveformCtx || !this.isVisible())
            return;
        var _a = this.getRangeTiming(), start = _a.start, end = _a.end, percent = _a.percent;
        var startpx = start * this._compositeWaveform.pixelsPerSecond;
        var endpx = end * this._compositeWaveform.pixelsPerSecond;
        var canvasWidth = this._waveformCtx.canvas.width;
        var canvasHeight = this._waveformCtx.canvas.height;
        var barSpacing = this._data.waveformBarSpacing;
        var barWidth = this._data.waveformBarWidth;
        var increment = Math.floor(((endpx - startpx) / canvasWidth) * barSpacing);
        var sampleSpacing = canvasWidth / barSpacing;
        this._waveformCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        this._waveformCtx.fillStyle = this._data.waveformColor || '#fff';
        var inc = canvasWidth / (end - start);
        var listOfBuffers = [];
        if (this._contentAnnotations) {
            for (var i = 0; i < this._contentAnnotations.length; i++) {
                var contentAnnotation = this._contentAnnotations[i];
                if (contentAnnotation && contentAnnotation.element) {
                    var element = contentAnnotation.element[0];
                    var annoStart = contentAnnotation.startOffest || 0;
                    var active = contentAnnotation.active;
                    if (active) {
                        for (var j = 0; j < element.buffered.length; j++) {
                            var reverse = element.buffered.length - j - 1;
                            var startX = element.buffered.start(reverse);
                            var endX = element.buffered.end(reverse);
                            listOfBuffers.push([(annoStart + startX - start) * inc, (annoStart + endX - start) * inc]);
                        }
                    }
                }
            }
        }
        var newList = [];
        if (this.isVirtual() && AVComponent.newRanges) {
            var plan = this.timePlanPlayer.plan;
            var compositeCanvas = this._data.canvas;
            for (var _i = 0, _b = plan.stops; _i < _b.length; _i++) {
                var stop_1 = _b[_i];
                var map = compositeCanvas.durationMap[plan.canvases[stop_1.canvasIndex]];
                var canvasEndTime = map.runningDuration;
                var canvasStartTime = canvasEndTime - map.duration;
                // Start percentage.
                // End percentage.
                newList.push({
                    start: (stop_1.start - plan.start) / plan.duration,
                    end: (stop_1.end - plan.start) / plan.duration,
                    duration: stop_1.duration,
                    startTime: canvasStartTime + stop_1.canvasTime.start,
                    endTime: canvasStartTime + stop_1.canvasTime.start + stop_1.canvasTime.end,
                });
            }
        }
        else {
            newList.push({
                start: 0,
                duration: end - start,
                end: end,
                startTime: start,
            });
        }
        // console.log('new list', newList);
        var current = 0;
        for (var x = startpx; x < endpx; x += increment) {
            var rangePercentage = normalise(x, startpx, endpx);
            var xpos = rangePercentage * canvasWidth;
            if (newList[current].end < rangePercentage) {
                current++;
            }
            var section = newList[current];
            // range percent 0..1
            // section.start = 1.73
            // section.duration = 1806
            // section.startTime = 1382
            // section.endTime = 5003
            //
            // What I need
            // - time in seconds for the current increment
            // startTime + (0) - the first will always be the start time.
            // startTime + ( rangePercentage *  )
            var partPercent = rangePercentage - section.start;
            var toSample = Math.floor((section.startTime + partPercent * section.duration) * this._compositeWaveform.pixelsPerSecond);
            // console.log('sample seconds -> ', { sample: toSample/60, partPercent, rangePercentage })
            var maxMin = this._getWaveformMaxAndMin(this._compositeWaveform, toSample, sampleSpacing);
            var height = this._scaleY(maxMin.max - maxMin.min, canvasHeight);
            var pastCurrentTime = xpos / canvasWidth < percent;
            var hoverWidth = this.waveformDeltaX / canvasWidth;
            var colour = this._data.waveformColor || '#fff';
            var ypos = (canvasHeight - height) / 2;
            if (pastCurrentTime) {
                if (this.waveformDeltaX === 0) {
                    // ======o_____
                    //   ^ this colour, no hover
                    colour = '#14A4C3';
                }
                else if (xpos / canvasWidth < hoverWidth) {
                    // ======T---o_____
                    //    ^ this colour
                    colour = '#11758e'; // dark
                }
                else {
                    // ======T---o_____
                    //         ^ this colour
                    colour = '#14A4C3'; // normal
                }
            }
            else if (xpos / canvasWidth < hoverWidth) {
                // ======o-------T_____
                //           ^ this colour
                colour = '#86b3c3'; // lighter
            }
            else {
                colour = '#8a9aa1';
                for (var _c = 0, listOfBuffers_1 = listOfBuffers; _c < listOfBuffers_1.length; _c++) {
                    var _d = listOfBuffers_1[_c], a = _d[0], b = _d[1];
                    if (xpos > a && xpos < b) {
                        colour = '#fff';
                        break;
                    }
                }
            }
            this._waveformCtx.fillStyle = colour;
            this._waveformCtx.fillRect(xpos, ypos, barWidth, height | 0);
        }
        return;
        //
        //
        //             // let i = 0;
        //             for (const [innerStartPx, innerEndPx, innerIncr, sectionWidth, offsetX] of startEndList) {
        //                 for (let x = innerStartPx; x < innerEndPx; x += innerIncr) {
        //                     const maxMin = this._getWaveformMaxAndMin(this._compositeWaveform, x, sampleSpacing);
        //                     const height = this._scaleY(maxMin.max - maxMin.min, canvasHeight);
        //                     const ypos = (canvasHeight - height) / 2;
        //                     const xpos = offsetX + (sectionWidth * normalise(x, innerStartPx, innerEndPx));
        //                     const pastCurrentTime = xpos / canvasWidth < percent;
        //                     const hoverWidth = this.waveformDeltaX / canvasWidth;
        //                     let colour = <string>this._data.waveformColor;
        //
        //                     // colour = ['#fff', 'red'][i % 2];
        //
        //                     // For colours.
        //                     // ======o-------T_____
        //                     //       ^ current time
        //                     // ======o-------T_____
        //                     //               ^ cursor
        //                     //
        //                     if (pastCurrentTime) {
        //                         if (this.waveformDeltaX === 0) {
        //                             // ======o_____
        //                             //   ^ this colour, no hover
        //                             colour = '#14A4C3';
        //                         } else if (xpos / canvasWidth < hoverWidth) {
        //                             // ======T---o_____
        //                             //    ^ this colour
        //                             colour = '#11758e'; // dark
        //                         } else {
        //                             // ======T---o_____
        //                             //         ^ this colour
        //                             colour = '#14A4C3'; // normal
        //                         }
        //                     } else if (xpos / canvasWidth < hoverWidth) {
        //                         // ======o-------T_____
        //                         //           ^ this colour
        //                         colour = '#86b3c3'; // lighter
        //                     } else {
        //                         colour = '#8a9aa1';
        //                         for (const [a, b] of listOfBuffers) {
        //                             if (xpos > a && xpos < b) {
        //                                 colour = '#fff';
        //                                 break;
        //                             }
        //                         }
        //                     }
        //
        //                     this._waveformCtx.fillStyle = colour;
        //                     this._waveformCtx.fillRect(xpos, ypos, barWidth, height | 0);
        //                 }
        //                 // i++;
        //             }
    };
    CanvasInstance.prototype._getWaveformMaxAndMin = function (waveform, index, sampleSpacing) {
        var max = -127;
        var min = 128;
        for (var x = index; x < index + sampleSpacing; x++) {
            var wMax = waveform.max(x);
            var wMin = waveform.min(x);
            if (wMax > max) {
                max = wMax;
            }
            if (wMin < min) {
                min = wMin;
            }
        }
        return { max: max, min: min };
    };
    CanvasInstance.prototype.isLimitedToRange = function () {
        return this._data.limitToRange;
    };
    CanvasInstance.prototype.hasCurrentRange = function () {
        return !!this._data.range;
    };
    CanvasInstance.prototype._updateCurrentTimeDisplay = function () {
        if (AVComponent.newRanges && this.isVirtual()) {
            this._$canvasTime.text(formatTime(this._canvasClockTime - this.timePlanPlayer.getStartTime()));
            return;
        }
        var duration;
        if (this._data.range) {
            duration = this._data.range.getDuration();
        }
        if (this._data.limitToRange && duration) {
            var rangeClockTime = this._canvasClockTime - duration.start;
            this._$canvasTime.text(formatTime(rangeClockTime));
        }
        else {
            this._$canvasTime.text(formatTime(this._canvasClockTime));
        }
    };
    CanvasInstance.prototype._updateDurationDisplay = function () {
        if (AVComponent.newRanges && this.isVirtual()) {
            this._$canvasDuration.text(formatTime(this.timePlanPlayer.getDuration()));
            return;
        }
        var duration;
        if (this._data.range) {
            duration = this._data.range.getDuration();
        }
        if (this._data.limitToRange && duration) {
            this._$canvasDuration.text(formatTime(duration.getLength()));
        }
        else {
            this._$canvasDuration.text(formatTime(this._getDuration()));
        }
    };
    CanvasInstance.prototype._renderSyncIndicator = function (mediaElementData) {
        if (AVComponent.newRanges && this.isVirtual()) {
            console.log('_renderSyncIndicator');
            return;
        }
        var leftPercent = this._convertToPercentage(mediaElementData.start, this._getDuration());
        var widthPercent = this._convertToPercentage(mediaElementData.end - mediaElementData.start, this._getDuration());
        var $timelineItem = $('<div class="timeline-item"></div>');
        $timelineItem.css({
            left: leftPercent + '%',
            width: widthPercent + '%',
        });
        var $lineWrapper = $('<div class="line-wrapper"></div>');
        $timelineItem.appendTo($lineWrapper);
        mediaElementData.timelineElement = $timelineItem;
        if (this.$playerElement) {
            this._$timelineItemContainer.append($lineWrapper);
        }
    };
    CanvasInstance.prototype.setCurrentTime = function (seconds) {
        console.log('External set current time?');
        return this._setCurrentTime(seconds, false);
    };
    CanvasInstance.prototype._setCurrentTime = function (seconds, setRange) {
        if (setRange === void 0) { setRange = true; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, start, end;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(AVComponent.newRanges && this.isVirtual())) return [3 /*break*/, 2];
                        this._buffering = true;
                        return [4 /*yield*/, this.timePlanPlayer.setTime(seconds, setRange)];
                    case 1:
                        _b.sent();
                        this._buffering = false;
                        this._canvasClockStartDate = Date.now() - this._canvasClockTime * 1000;
                        this._canvasClockUpdater();
                        this._highPriorityUpdater();
                        this._lowPriorityUpdater();
                        this._synchronizeMedia();
                        return [2 /*return*/];
                    case 2:
                        _a = this.getRangeTiming(), start = _a.start, end = _a.end;
                        if (seconds < start || start > end) {
                            return [2 /*return*/];
                        }
                        this._canvasClockTime = seconds; //secondsAsFloat;
                        this._canvasClockStartDate = Date.now() - this._canvasClockTime * 1000;
                        this.logMessage('SET CURRENT TIME to: ' + this._canvasClockTime + ' seconds.');
                        this._canvasClockUpdater();
                        this._highPriorityUpdater();
                        this._lowPriorityUpdater();
                        this._synchronizeMedia();
                        return [2 /*return*/];
                }
            });
        });
    };
    CanvasInstance.prototype._rewind = function (withoutUpdate) {
        if (AVComponent.newRanges && this.isVirtual()) {
            console.log('Rewind');
            return;
        }
        this.pause();
        var duration;
        if (this._data.range) {
            duration = this._data.range.getDuration();
        }
        if (this._data.limitToRange && duration) {
            this._setCurrentTime(duration.start);
        }
        else {
            this._setCurrentTime(0);
        }
        if (!this._data.limitToRange) {
            if (this._data && this._data.helper) {
                this.set({
                    range: undefined,
                });
            }
        }
    };
    CanvasInstance.prototype._fastforward = function () {
        if (AVComponent.newRanges && this.isVirtual()) {
            console.log('Fast forward');
            return;
        }
        var duration;
        if (this._data.range) {
            duration = this._data.range.getDuration();
        }
        if (this._data.limitToRange && duration) {
            this._canvasClockTime = duration.end;
        }
        else {
            this._canvasClockTime = this._getDuration();
        }
        this.pause();
    };
    // todo: can this be part of the _data state?
    // this._data.play = true?
    CanvasInstance.prototype.play = function (withoutUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var duration, label;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._isPlaying)
                            return [2 /*return*/];
                        if (!(AVComponent.newRanges && this.isVirtual())) return [3 /*break*/, 3];
                        if (!this.timePlanPlayer.hasEnded()) return [3 /*break*/, 2];
                        this._buffering = true;
                        return [4 /*yield*/, this.timePlanPlayer.setTime(this.timePlanPlayer.currentStop.start)];
                    case 1:
                        _a.sent();
                        this._buffering = false;
                        _a.label = 2;
                    case 2:
                        this.timePlanPlayer.play();
                        return [3 /*break*/, 4];
                    case 3:
                        duration = void 0;
                        if (this._data.range) {
                            duration = this._data.range.getDuration();
                        }
                        if (this._data.limitToRange && duration && this._canvasClockTime >= duration.end) {
                            this._canvasClockTime = duration.start;
                        }
                        if (this._canvasClockTime === this._getDuration()) {
                            this._canvasClockTime = 0;
                        }
                        _a.label = 4;
                    case 4:
                        this._canvasClockStartDate = Date.now() - this._canvasClockTime * 1000;
                        if (this._highPriorityInterval) {
                            clearInterval(this._highPriorityInterval);
                        }
                        this._highPriorityInterval = window.setInterval(function () {
                            _this._highPriorityUpdater();
                        }, this._highPriorityFrequency);
                        if (this._lowPriorityInterval) {
                            clearInterval(this._lowPriorityInterval);
                        }
                        this._lowPriorityInterval = window.setInterval(function () {
                            _this._lowPriorityUpdater();
                        }, this._lowPriorityFrequency);
                        if (this._canvasClockInterval) {
                            clearInterval(this._canvasClockInterval);
                        }
                        this._canvasClockInterval = window.setInterval(function () {
                            _this._canvasClockUpdater();
                        }, this._canvasClockFrequency);
                        this._isPlaying = true;
                        if (!withoutUpdate) {
                            this._synchronizeMedia();
                        }
                        label = this._data && this._data.content ? this._data.content.pause : '';
                        this._$playButton.prop('title', label);
                        this._$playButton.find('i').switchClass('play', 'pause');
                        this.fire(CanvasInstanceEvents.PLAYCANVAS);
                        this.logMessage('PLAY canvas');
                        return [2 /*return*/];
                }
            });
        });
    };
    // todo: can this be part of the _data state?
    // this._data.play = false?
    CanvasInstance.prototype.pause = function (withoutUpdate) {
        window.clearInterval(this._highPriorityInterval);
        window.clearInterval(this._lowPriorityInterval);
        window.clearInterval(this._canvasClockInterval);
        this._isPlaying = false;
        if (!withoutUpdate) {
            this._highPriorityUpdater();
            this._lowPriorityUpdater();
            this._synchronizeMedia();
        }
        if (AVComponent.newRanges && this.isVirtual()) {
            this.timePlanPlayer.pause();
        }
        var label = this._data && this._data.content ? this._data.content.play : '';
        this._$playButton.prop('title', label);
        this._$playButton.find('i').switchClass('pause', 'play');
        this.fire(CanvasInstanceEvents.PAUSECANVAS);
        this.logMessage('PAUSE canvas');
    };
    CanvasInstance.prototype._isNavigationConstrainedToRange = function () {
        return this._data.constrainNavigationToRange || false;
    };
    CanvasInstance.prototype._canvasClockUpdater = function () {
        if (AVComponent.newRanges && this.isVirtual()) {
            if (this._buffering) {
                return;
            }
            var paused = this.timePlanPlayer.advanceToTime((Date.now() - this._canvasClockStartDate) / 1000).paused;
            if (paused) {
                this.pause();
            }
            // console.log('_canvasClockUpdater');
            return;
        }
        if (this._buffering) {
            return;
        }
        this._canvasClockTime = (Date.now() - this._canvasClockStartDate) / 1000;
        var duration;
        if (this._data.range) {
            duration = this._data.range.getDuration();
        }
        if (this._data.limitToRange && duration && this._canvasClockTime >= duration.end) {
            this.pause();
        }
        if (this._canvasClockTime >= this._getDuration()) {
            this._canvasClockTime = this._getDuration();
            this.pause();
        }
    };
    CanvasInstance.prototype._highPriorityUpdater = function () {
        if (this._bufferShown && !this._buffering) {
            this.$playerElement.removeClass('player--loading');
            this._bufferShown = false;
        }
        if (this._buffering && !this._bufferShown) {
            this.$playerElement.addClass('player--loading');
            this._bufferShown = true;
        }
        if (AVComponent.newRanges && this.isVirtual()) {
            this._$rangeTimelineContainer.slider({
                value: this._canvasClockTime - this.timePlanPlayer.plan.start,
            });
            this._$canvasTimelineContainer.slider({
                value: this._canvasClockTime - this.timePlanPlayer.plan.start,
            });
        }
        else {
            this._$rangeTimelineContainer.slider({
                value: this._canvasClockTime,
            });
            this._$canvasTimelineContainer.slider({
                value: this._canvasClockTime,
            });
        }
        this._updateCurrentTimeDisplay();
        this._updateDurationDisplay();
        this._drawWaveform();
    };
    CanvasInstance.prototype._lowPriorityUpdater = function () {
        this._updateMediaActiveStates();
        if ( /*this._isPlaying && */this._data.autoSelectRange && (this.isVirtual() || this.isOnlyCanvasInstance)) {
            this._hasRangeChanged();
        }
    };
    CanvasInstance.prototype._updateMediaActiveStates = function () {
        if (AVComponent.newRanges && this.isVirtual()) {
            if (this._isPlaying) {
                if (this.timePlanPlayer.isBuffering()) {
                    this._buffering = true;
                    return;
                }
                else if (this._buffering) {
                    this._buffering = false;
                }
                this.timePlanPlayer.advanceToTime(this._canvasClockTime);
            }
            return;
        }
        var contentAnnotation;
        for (var i = 0; i < this._contentAnnotations.length; i++) {
            contentAnnotation = this._contentAnnotations[i];
            if (contentAnnotation.start <= this._canvasClockTime && contentAnnotation.end >= this._canvasClockTime) {
                this._checkMediaSynchronization();
                if (!contentAnnotation.active) {
                    this._synchronizeMedia();
                    contentAnnotation.active = true;
                    contentAnnotation.element.show();
                    contentAnnotation.timelineElement.addClass('active');
                }
                if (contentAnnotation.element[0].currentTime >
                    contentAnnotation.element[0].duration - contentAnnotation.endOffset) {
                    this._pauseMedia(contentAnnotation.element[0]);
                }
            }
            else {
                if (contentAnnotation.active) {
                    contentAnnotation.active = false;
                    contentAnnotation.element.hide();
                    contentAnnotation.timelineElement.removeClass('active');
                    this._pauseMedia(contentAnnotation.element[0]);
                }
            }
        }
        //this.logMessage('UPDATE MEDIA ACTIVE STATES at: '+ this._canvasClockTime + ' seconds.');
    };
    CanvasInstance.prototype._pauseMedia = function (media) {
        media.pause();
        // const playPromise = media.play();
        // if (playPromise !== undefined) {
        //     playPromise.then(_ => {
        //         // https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
        //         media.pause();
        //     });
        // } else {
        //     media.pause();
        // }
    };
    CanvasInstance.prototype._setMediaCurrentTime = function (media, time) {
        if (!isNaN(media.duration)) {
            media.currentTime = time;
        }
    };
    CanvasInstance.prototype._synchronizeMedia = function () {
        if (AVComponent.newRanges && this.isVirtual()) {
            // console.log('_synchronizeMedia', this.timePlanPlayer.isBuffering());
            return;
        }
        var contentAnnotation;
        for (var i = 0; i < this._contentAnnotations.length; i++) {
            contentAnnotation = this._contentAnnotations[i];
            this._setMediaCurrentTime(contentAnnotation.element[0], this._canvasClockTime - contentAnnotation.start + contentAnnotation.startOffset);
            if (contentAnnotation.start <= this._canvasClockTime && contentAnnotation.end >= this._canvasClockTime) {
                if (this._isPlaying) {
                    if (contentAnnotation.element[0].paused) {
                        var promise = contentAnnotation.element[0].play();
                        if (promise) {
                            promise.catch(function () {
                                // no-op
                            });
                        }
                    }
                }
                else {
                    this._pauseMedia(contentAnnotation.element[0]);
                }
            }
            else {
                this._pauseMedia(contentAnnotation.element[0]);
            }
            if (contentAnnotation.element[0].currentTime >
                contentAnnotation.element[0].duration - contentAnnotation.endOffset) {
                this._pauseMedia(contentAnnotation.element[0]);
            }
        }
        this.logMessage('SYNC MEDIA at: ' + this._canvasClockTime + ' seconds.');
    };
    CanvasInstance.prototype._checkMediaSynchronization = function () {
        if (AVComponent.newRanges && this.isVirtual()) {
            if (this._isPlaying) {
                if (this.timePlanPlayer.isBuffering()) {
                    this._buffering = true;
                }
                else if (this._buffering) {
                    this._buffering = false;
                }
            }
            return;
        }
        var contentAnnotation;
        for (var i = 0, l = this._contentAnnotations.length; i < l; i++) {
            contentAnnotation = this._contentAnnotations[i];
            if (contentAnnotation.start <= this._canvasClockTime && contentAnnotation.end >= this._canvasClockTime) {
                if (this._isPlaying) {
                    if (contentAnnotation.element[0].readyState < 3) {
                        this._buffering = true;
                    }
                    else if (this._buffering) {
                        this._buffering = false;
                    }
                }
                var correctTime = this._canvasClockTime - contentAnnotation.start + contentAnnotation.startOffset;
                var factualTime = contentAnnotation.element[0].currentTime;
                // off by 0.2 seconds
                if (Math.abs(factualTime - correctTime) > this._mediaSyncMarginSecs) {
                    contentAnnotation.outOfSync = true;
                    //this.playbackStalled(true, contentAnnotation);
                    var lag = Math.abs(factualTime - correctTime);
                    this.logMessage('DETECTED synchronization lag: ' + Math.abs(lag));
                    this._setMediaCurrentTime(contentAnnotation.element[0], correctTime);
                    //this.synchronizeMedia();
                }
                else {
                    contentAnnotation.outOfSync = false;
                    //this.playbackStalled(false, contentAnnotation);
                }
            }
        }
    };
    CanvasInstance.prototype._playbackStalled = function (aBoolean, syncMediaRequestingStall) {
        if (aBoolean) {
            if (this._stallRequestedBy.indexOf(syncMediaRequestingStall) < 0) {
                this._stallRequestedBy.push(syncMediaRequestingStall);
            }
            if (!this._isStalled) {
                if (this.$playerElement) {
                    //this._showWorkingIndicator(this._$canvasContainer);
                }
                this._wasPlaying = this._isPlaying;
                this.pause(true);
                this._isStalled = aBoolean;
            }
        }
        else {
            var idx = this._stallRequestedBy.indexOf(syncMediaRequestingStall);
            if (idx >= 0) {
                this._stallRequestedBy.splice(idx, 1);
            }
            if (this._stallRequestedBy.length === 0) {
                //this._hideWorkingIndicator();
                if (this._isStalled && this._wasPlaying) {
                    this.play(true);
                }
                this._isStalled = aBoolean;
            }
        }
    };
    CanvasInstance.prototype.resize = function () {
        if (this.$playerElement) {
            var containerWidth = this._$canvasContainer.width();
            if (containerWidth) {
                this._$canvasTimelineContainer.width(containerWidth);
                //const resizeFactorY: number = containerWidth / this.canvasWidth;
                //$canvasContainer.height(this.canvasHeight * resizeFactorY);
                var $options = this.$playerElement.find('.options-container');
                // if in the watch metric, make sure the canvasContainer isn't more than half the height to allow
                // room between buttons
                if (this._data.halveAtWidth !== undefined && this.$playerElement.parent().width() < this._data.halveAtWidth) {
                    this._$canvasContainer.height(this.$playerElement.parent().height() / 2);
                }
                else {
                    this._$canvasContainer.height(this.$playerElement.parent().height() - $options.height());
                }
            }
            if (this._waveformCanvas) {
                var canvasWidth = this._$canvasContainer.width();
                var canvasHeight = this._$canvasContainer.height();
                this._waveformCanvas.width = canvasWidth;
                this._waveformCanvas.height = canvasHeight;
                this.waveformPageX = this._waveformCanvas.getBoundingClientRect().left;
            }
            this._render();
            this._drawWaveform();
        }
    };
    return CanvasInstance;
}(BaseComponent));
export { CanvasInstance };
//# sourceMappingURL=canvas-instance.js.map