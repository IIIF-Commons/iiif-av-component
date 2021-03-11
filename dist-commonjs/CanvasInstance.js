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
var base_component_1 = require("@iiif/base-component");
var manifesto_js_1 = require("manifesto.js");
var _1 = require(".");
var VirtualCanvas_1 = require("./VirtualCanvas");
var CompositeWaveform_1 = require("./CompositeWaveform");
var VolumeControl_1 = require("./VolumeControl");
var Utils_1 = require("./Utils");
var vocabulary_1 = require("@iiif/vocabulary");
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
        _this._lowPriorityFrequency = 250;
        _this._mediaSyncMarginSecs = 1;
        _this._rangeSpanPadding = 0.25;
        _this._readyMediaCount = 0;
        _this._stallRequestedBy = []; //todo: type
        _this._wasPlaying = false;
        _this.ranges = [];
        _this.waveforms = [];
        _this._mediaDuration = 0;
        _this.isOnlyCanvasInstance = false;
        _this._scaleY = function (amplitude, height) {
            var range = 256;
            return Math.max(_this._data.waveformBarWidth, (amplitude * height) / range);
        };
        _this._data = _this.options.data;
        _this.$playerElement = $('<div class="player"></div>');
        return _this;
    }
    CanvasInstance.prototype.init = function () {
        var _this = this;
        if (!this._data || !this._data.content || !this._data.canvas) {
            console.warn("unable to initialise, missing canvas or content");
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
        this._$prevButton = $("\n                            <button class=\"btn\" title=\"" + this._data.content.previous + "\">\n                                <i class=\"av-icon av-icon-previous\" aria-hidden=\"true\"></i>" + this._data.content.previous + "\n                            </button>");
        this._$playButton = $("\n                            <button class=\"btn button-play\" disabled=\"disabled\" title=\"" + this._data.content.play + "\">\n                                <i class=\"av-icon av-icon-play play\" aria-hidden=\"true\"></i>" + this._data.content.play + "\n                            </button>");
        this._$nextButton = $("\n                            <button class=\"btn\" title=\"" + this._data.content.next + "\">\n                                <i class=\"av-icon av-icon-next\" aria-hidden=\"true\"></i>" + this._data.content.next + "\n                            </button>");
        this._$timeDisplay = $('<div class="time-display"><span class="canvas-time"></span> / <span class="canvas-duration"></span></div>');
        this._$canvasTime = this._$timeDisplay.find(".canvas-time");
        this._$canvasDuration = this._$timeDisplay.find(".canvas-duration");
        this._$canvasLoadingProgress = $('<div class="loading-progress"></div>');
        this._$fullscreenButton = $("\n                                <button class=\"btn button-fullscreen\" title=\"" + this._data.content.fullscreen + "\">\n                                    <i class=\"av-icon av-icon-fullscreen\" aria-hidden=\"true\"></i>" + this._data.content.fullscreen + "\n                                </button>");
        if (this.isVirtual()) {
            this.$playerElement.addClass("virtual");
        }
        var $volume = $('<div class="volume"></div>');
        this._volume = new VolumeControl_1.AVVolumeControl({
            target: $volume[0],
            data: Object.assign({}, this._data)
        });
        this._volume.on(VolumeControl_1.VolumeEvents.VOLUME_CHANGED, function (value) {
            _this.fire(VolumeControl_1.VolumeEvents.VOLUME_CHANGED, value);
        }, false);
        this._$controlsContainer.append(this._$prevButton, this._$playButton, this._$nextButton, this._$timeDisplay, $volume, this._$fullscreenButton);
        this._$canvasTimelineContainer.append(this._$canvasHoverPreview, this._$canvasHoverHighlight, this._$durationHighlight, this._$canvasLoadingProgress);
        this._$rangeTimelineContainer.append(this._$rangeHoverPreview, this._$rangeHoverHighlight);
        this._$optionsContainer.append(this._$canvasTimelineContainer, this._$rangeTimelineContainer, this._$timelineItemContainer, this._$controlsContainer);
        this.$playerElement.append(this._$canvasContainer, this._$optionsContainer);
        this._$canvasHoverPreview.hide();
        this._$rangeHoverPreview.hide();
        if (this._data && this._data.helper && this._data.canvas) {
            this.$playerElement.attr('data-id', this._data.canvas.id);
            var ranges_1 = [];
            // if the canvas is virtual, get the ranges for all sub canvases
            if (this.isVirtual()) {
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
                                    clonedRange.canvases[i] = (Utils_1.AVComponentUtils.retargetTemporalComponent(_this._data.canvas.canvases, clonedRange.__jsonld.items[i].id));
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
        var canvasWidth = this._data.canvas.getWidth();
        var canvasHeight = this._data.canvas.getHeight();
        if (!canvasWidth) {
            this._canvasWidth = this.$playerElement.parent().width(); // this._data.defaultCanvasWidth;
        }
        else {
            this._canvasWidth = canvasWidth;
        }
        if (!canvasHeight) {
            this._canvasHeight =
                this._canvasWidth * this._data.defaultAspectRatio; //this._data.defaultCanvasHeight;
        }
        else {
            this._canvasHeight = canvasHeight;
        }
        var that = this;
        var prevClicks = 0;
        var prevTimeout = 0;
        this._$prevButton.on("touchstart click", function (e) {
            e.preventDefault();
            prevClicks++;
            if (prevClicks === 1) {
                // single click
                //console.log('single');
                _this._previous(false);
                prevTimeout = setTimeout(function () {
                    prevClicks = 0;
                    prevTimeout = 0;
                }, _this._data.doubleClickMS);
            }
            else {
                // double click
                //console.log('double');
                _this._previous(true);
                clearTimeout(prevTimeout);
                prevClicks = 0;
                prevTimeout = 0;
            }
        });
        this._$playButton.on("touchstart click", function (e) {
            e.preventDefault();
            if (_this._isPlaying) {
                _this.pause();
            }
            else {
                _this.play();
            }
        });
        this._$nextButton.on("touchstart click", function (e) {
            e.preventDefault();
            _this._next();
        });
        this._$canvasTimelineContainer.slider({
            value: 0,
            step: 0.01,
            orientation: "horizontal",
            range: "min",
            max: that._getDuration(),
            animate: false,
            create: function (evt, ui) {
                // on create
            },
            slide: function (evt, ui) {
                that.setCurrentTime(ui.value);
            },
            stop: function (evt, ui) {
                //this._setCurrentTime(ui.value);
            }
        });
        this._$canvasTimelineContainer.mouseout(function () {
            that._$canvasHoverHighlight.width(0);
            that._$canvasHoverPreview.hide();
        });
        this._$rangeTimelineContainer.mouseout(function () {
            that._$rangeHoverHighlight.width(0);
            that._$rangeHoverPreview.hide();
        });
        this._$canvasTimelineContainer.on("mousemove", function (e) {
            _this._updateHoverPreview(e, _this._$canvasTimelineContainer, _this._getDuration());
        });
        this._$rangeTimelineContainer.on("mousemove", function (e) {
            if (_this._data.range) {
                var duration = _this._data.range.getDuration();
                _this._updateHoverPreview(e, _this._$rangeTimelineContainer, duration ? duration.getLength() : 0);
            }
        });
        this._$fullscreenButton[0].addEventListener('click', function (e) {
            e.preventDefault();
            var fsDoc = document;
            if (!fsDoc.fullscreenElement && !fsDoc.mozFullScreenElement && !fsDoc.webkitFullscreenElement && !fsDoc.msFullscreenElement) {
                var fsDocElem = _this.$playerElement.get(0);
                _this.fire(_1.Events.FULLSCREEN, "on");
                if (fsDocElem.requestFullscreen)
                    fsDocElem.requestFullscreen();
                else if (fsDocElem.msRequestFullscreen)
                    fsDocElem.msRequestFullscreen();
                else if (fsDocElem.mozRequestFullScreen)
                    fsDocElem.mozRequestFullScreen();
                else if (fsDocElem.webkitRequestFullscreen)
                    fsDocElem.webkitRequestFullscreen();
            }
            else {
                _this.fire(_1.Events.FULLSCREEN, "off");
                if (fsDoc.exitFullscreen)
                    fsDoc.exitFullscreen();
                else if (fsDoc.msExitFullscreen)
                    fsDoc.msExitFullscreen();
                else if (fsDoc.mozCancelFullScreen)
                    fsDoc.mozCancelFullScreen();
                else if (fsDoc.webkitExitFullscreen)
                    fsDoc.webkitExitFullscreen();
            }
        }, false);
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
                console.warn("item has no body");
                return;
            }
            var body = this._getBody(bodies);
            if (!body) {
                // if no suitable format was found for the current browser, skip this item.
                console.warn("unable to find suitable format for", item.id);
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
            if (type && type.toString() === "textualbody") {
                //mediaSource = (<any>body).value;
            }
            else {
                mediaSource = body.id.split("#")[0];
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
                console.warn("item has no target");
                return;
            }
            var xywh = Utils_1.AVComponentUtils.getSpatialComponent(target);
            var t = manifesto_js_1.Utils.getTemporalComponent(target);
            if (!xywh) {
                xywh = [0, 0, this._canvasWidth, this._canvasHeight];
            }
            if (!t) {
                t = [0, this._getDuration()];
            }
            var positionLeft = parseInt(String(xywh[0])), positionTop = parseInt(String(xywh[1])), mediaWidth = parseInt(String(xywh[2])), mediaHeight = parseInt(String(xywh[3])), startTime = parseInt(String(t[0])), endTime = parseInt(String(t[1]));
            var percentageTop = this._convertToPercentage(positionTop, this._canvasHeight), percentageLeft = this._convertToPercentage(positionLeft, this._canvasWidth), percentageWidth = this._convertToPercentage(mediaWidth, this._canvasWidth), percentageHeight = this._convertToPercentage(mediaHeight, this._canvasHeight);
            var temporalOffsets = /[\?|&]t=([^&]+)/g.exec(body.id);
            var ot = void 0;
            if (temporalOffsets && temporalOffsets[1]) {
                ot = temporalOffsets[1].split(",");
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
                width: percentageWidth
            };
            this._renderMediaElement(itemData);
            // waveform
            // todo: create annotation.getSeeAlso
            var seeAlso = item.getProperty("seeAlso");
            if (seeAlso && seeAlso.length) {
                var dat = seeAlso[0].id;
                this.waveforms.push(dat);
            }
        }
        this._renderWaveform();
    };
    CanvasInstance.prototype._getBody = function (bodies) {
        // if there's an HLS format and HLS is supported in this browser
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            var format = body.getFormat();
            if (format) {
                if (Utils_1.AVComponentUtils.isHLSFormat(format) &&
                    Utils_1.AVComponentUtils.canPlayHls()) {
                    return body;
                }
            }
        }
        // if there's a Dash format and the browser isn't Safari
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            var format = body.getFormat();
            if (format) {
                if (Utils_1.AVComponentUtils.isMpegDashFormat(format) &&
                    !Utils_1.AVComponentUtils.isSafari()) {
                    return body;
                }
            }
        }
        // otherwise, return the first format that isn't HLS or Dash
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            var format = body.getFormat();
            if (format) {
                if (!Utils_1.AVComponentUtils.isHLSFormat(format) &&
                    !Utils_1.AVComponentUtils.isMpegDashFormat(format)) {
                    return body;
                }
            }
        }
        // couldn't find a suitable format
        return null;
    };
    CanvasInstance.prototype._getDuration = function () {
        if (this._data && this._data.canvas) {
            var duration = this._data.canvas.getDuration();
            if (isNaN(duration) || duration <= 0) {
                duration = this._mediaDuration;
            }
            return duration;
        }
        return 0;
    };
    CanvasInstance.prototype.data = function () {
        return {
            waveformColor: "#fff",
            waveformBarSpacing: 4,
            waveformBarWidth: 2,
            volume: 1
        };
    };
    CanvasInstance.prototype.isVirtual = function () {
        return this._data.canvas instanceof VirtualCanvas_1.VirtualCanvas;
    };
    CanvasInstance.prototype.isVisible = function () {
        return !!this._data.visible;
    };
    CanvasInstance.prototype.includesVirtualSubCanvas = function (canvasId) {
        if (this.isVirtual() &&
            this._data.canvas &&
            this._data.canvas.canvases) {
            for (var i = 0; i < this._data.canvas.canvases.length; i++) {
                var canvas = this._data.canvas.canvases[i];
                if (manifesto_js_1.Utils.normaliseUrl(canvas.id) === canvasId) {
                    return true;
                }
            }
        }
        return false;
    };
    CanvasInstance.prototype.set = function (data) {
        var _this = this;
        var oldData = Object.assign({}, this._data);
        this._data = Object.assign(this._data, data);
        var diff = Utils_1.AVComponentUtils.diff(oldData, this._data);
        if (diff.includes("visible")) {
            if (this._data.canvas) {
                if (this._data.visible) {
                    this._rewind();
                    if (this.$playerElement.find("video")) {
                        this.$playerElement.find("video").attr("preload", "auto");
                    }
                    if (this.$playerElement.find("audio")) {
                        this.$playerElement.find("audio").attr("preload", "auto");
                    }
                    this.$playerElement.show();
                    //console.log('show ' + this._data.canvas.id);
                }
                else {
                    this.$playerElement.hide();
                    this.pause();
                    //console.log('hide ' + this._data.canvas.id);
                }
                this.resize();
            }
        }
        if (diff.includes("range")) {
            if (this._data.helper) {
                if (!this._data.range) {
                    this.fire(_1.Events.RANGE_CHANGED, null);
                }
                else {
                    var duration = this._data.range.getDuration();
                    if (duration) {
                        if (!this._data.range.autoChanged) {
                            this.setCurrentTime(duration.start);
                        }
                        if (this._data.autoPlay) {
                            this.play();
                        }
                        this.fire(_1.Events.RANGE_CHANGED, this._data.range.id);
                    }
                }
            }
        }
        if (diff.includes("volume")) {
            this._contentAnnotations.forEach(function ($mediaElement) {
                var volume = _this._data.volume !== undefined ? _this._data.volume : 1;
                $($mediaElement.element).prop("volume", volume);
                _this._volume.set({
                    volume: _this._data.volume
                });
            });
        }
        else {
            this._render();
        }
        if (diff.includes("limitToRange")) {
            this._render();
        }
    };
    CanvasInstance.prototype._hasRangeChanged = function () {
        var range = this._getRangeForCurrentTime();
        if (range &&
            !this._data.limitToRange &&
            (!this._data.range ||
                (this._data.range && range.id !== this._data.range.id))) {
            this.set({
                range: jQuery.extend(true, { autoChanged: true }, range)
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
            // if the range spans the current time, and is navigable, return it.
            // otherwise, try to find a navigable child range.
            if (this._rangeSpansCurrentTime(range)) {
                if (this._rangeNavigable(range)) {
                    return range;
                }
                var childRanges = range.getRanges();
                // if a child range spans the current time, recurse into it
                for (var i_1 = 0; i_1 < childRanges.length; i_1++) {
                    var childRange = childRanges[i_1];
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
        if (behavior && behavior.toString() === vocabulary_1.Behavior.NO_NAV) {
            return false;
        }
        return true;
    };
    CanvasInstance.prototype._render = function () {
        if (this._data.range) {
            var duration = this._data.range.getDuration();
            if (duration) {
                // get the total length in seconds.
                var totalLength = this._getDuration();
                // get the length of the timeline container
                var timelineLength = (this._$canvasTimelineContainer.width());
                // get the ratio of seconds to length
                var ratio = timelineLength / totalLength;
                var start = duration.start * ratio;
                var end = duration.end * ratio;
                // if the end is on the next canvas
                if (end > totalLength || end < start) {
                    end = totalLength;
                }
                var width = end - start;
                //console.log(width);
                if (this.isVirtual() || this.isOnlyCanvasInstance) {
                    this._$durationHighlight.show();
                    // set the start position and width
                    this._$durationHighlight.css({
                        left: start,
                        width: width
                    });
                }
                else {
                    this._$durationHighlight.hide();
                }
                var that_1 = this;
                // try to destroy existing rangeTimelineContainer
                if (this._$rangeTimelineContainer.data("ui-sortable")) {
                    this._$rangeTimelineContainer.slider("destroy");
                }
                this._$rangeTimelineContainer.slider({
                    value: duration.start,
                    step: 0.01,
                    orientation: "horizontal",
                    range: "min",
                    min: duration.start,
                    max: duration.end,
                    animate: false,
                    create: function (evt, ui) {
                        // on create
                    },
                    slide: function (evt, ui) {
                        that_1.setCurrentTime(ui.value);
                    },
                    stop: function (evt, ui) {
                        //this._setCurrentTime(ui.value);
                    }
                });
            }
        }
        else {
            this._$durationHighlight.hide();
        }
        if (this._data.limitToRange && this._data.range) {
            this._$canvasTimelineContainer.hide();
            this._$rangeTimelineContainer.show();
        }
        else {
            this._$canvasTimelineContainer.show();
            this._$rangeTimelineContainer.hide();
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
        var $hoverArrow = $container.find(".arrow");
        var $hoverHighlight = $container.find(".hover-highlight");
        var $hoverPreview = $container.find(".hover-preview");
        $hoverHighlight.width(x);
        var fullWidth = $container.width();
        var ratio = x / fullWidth;
        var seconds = Math.min(duration * ratio);
        $hoverPreview.find(".label").text(Utils_1.AVComponentUtils.formatTime(seconds));
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
            top: hoverPreviewHeight * -1 + "px"
        })
            .show();
        $hoverArrow.css({
            left: arrowLeft
        });
    };
    CanvasInstance.prototype._previous = function (isDouble) {
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
                        range: undefined
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
            case "video":
                $mediaElement = $('<video class="anno" />');
                break;
            case "sound":
            case "audio":
                $mediaElement = $('<audio class="anno" />');
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
        media.onerror = function () {
            _this.fire(_1.Events.MEDIA_ERROR, media.error);
        };
        if (data.format && data.format.toString() === "application/dash+xml") {
            // dash
            $mediaElement.attr("data-dashjs-player", "");
            var player = dashjs.MediaPlayer().create();
            player.getDebug().setLogToBrowserConsole(false);
            if (this._data.adaptiveAuthEnabled) {
                player.setXHRWithCredentialsForType("MPD", true); // send cookies
            }
            player.initialize(media, data.source);
        }
        else if (data.format &&
            data.format.toString() === "application/vnd.apple.mpegurl") {
            // hls
            if (Hls.isSupported()) {
                var hls = new Hls();
                if (this._data.adaptiveAuthEnabled) {
                    hls = new Hls({
                        xhrSetup: function (xhr) {
                            xhr.withCredentials = true; // send cookies
                        }
                    });
                }
                else {
                    hls = new Hls();
                }
                if (this._data.adaptiveAuthEnabled) {
                }
                hls.loadSource(data.source);
                hls.attachMedia(media);
                //hls.on(Hls.Events.MANIFEST_PARSED, function () {
                //media.play();
                //});
            }
            // hls.js is not supported on platforms that do not have Media Source Extensions (MSE) enabled.
            // When the browser has built-in HLS support (check using `canPlayType`), we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video element throught the `src` property.
            // This is using the built-in support of the plain video element, without using hls.js.
            else if (media.canPlayType("application/vnd.apple.mpegurl")) {
                media.src = data.source;
                //media.addEventListener('canplay', function () {
                //media.play();
                //});
            }
        }
        else {
            $mediaElement.attr("src", data.source);
        }
        $mediaElement
            .css({
            top: data.top + "%",
            left: data.left + "%",
            width: data.width + "%",
            height: data.height + "%"
        })
            .hide();
        data.element = $mediaElement;
        data.timeout = null;
        var that = this;
        data.checkForStall = function () {
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
        $mediaElement.on("loadstart", function () {
            //console.log('loadstart');
            //data.checkForStall();
        });
        $mediaElement.on("waiting", function () {
            //console.log('waiting');
            //data.checkForStall();
        });
        $mediaElement.on("seeking", function () {
            //console.log('seeking');
            //data.checkForStall();
        });
        $mediaElement.on("loadedmetadata", function () {
            _this._readyMediaCount++;
            if (_this._readyMediaCount === _this._contentAnnotations.length) {
                //if (!this._data.range) {
                _this.setCurrentTime(0);
                //}
                if (_this._data.autoPlay) {
                    _this.play();
                }
                _this._updateDurationDisplay();
                _this.fire(_1.Events.MEDIA_READY);
            }
            var duration = _this._getDuration();
            //when we have incorrect timing so we set it according to the media source
            if (isNaN(duration) || duration <= 0) {
                _this._mediaDuration = media.duration;
                //needed for the video to show for the whole duration
                _this._contentAnnotations.forEach(function (contentAnnotation) {
                    if (contentAnnotation.element[0].src == media.src) {
                        contentAnnotation.end = media.duration;
                    }
                });
                //updates the display timing
                if (_this._data.helper && _this._data.helper.manifest && _this._data.helper.manifest.items[0].items) {
                    var items = _this._data.helper.manifest.items[0].items;
                    for (var i = 0; i < items.length; i++) {
                        if (items[i].__jsonld.items[0].items[0].body.id == media.src) {
                            items[i].__jsonld.duration = media.duration;
                            _this.set({
                                helper: _this._data.helper
                            });
                            break;
                        }
                    }
                }
                //makes the slider scrubable for the entire duration
                _this._$canvasTimelineContainer.slider("option", "max", media.duration);
            }
        });
        $mediaElement.on('progress', function () {
            if (media.buffered.length > 0) {
                var duration = media.duration;
                var bufferedEnd = media.buffered.end(media.buffered.length - 1);
                if (duration > 0) {
                    _this._$optionsContainer.find(".loading-progress").width(((bufferedEnd / duration) * 100) + "%");
                }
            }
        });
        $mediaElement.on("canplaythrough", function () {
            _this._$playButton.prop("disabled", false);
            if (_this.isVisible()) {
                $mediaElement.attr("preload", "auto");
            }
        });
        $mediaElement.attr("preload", "metadata");
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
                type: "GET",
                dataType: "binary",
                responseType: "arraybuffer",
                processData: false
            })
                .done(function (data) {
                resolve(WaveformData.create(data));
            })
                .fail(function (err) {
                reject(new Error("Network Error"));
            });
        });
    };
    CanvasInstance.prototype._renderWaveform = function () {
        var _this = this;
        if (!this.waveforms.length)
            return;
        var promises = this.waveforms.map(function (url) {
            return _this._getWaveformData(url);
        });
        Promise.all(promises).then(function (waveforms) {
            _this._waveformCanvas = document.createElement("canvas");
            _this._waveformCanvas.classList.add("waveform");
            _this._$canvasContainer.append(_this._waveformCanvas);
            _this._waveformCtx = _this._waveformCanvas.getContext("2d");
            if (_this._waveformCtx) {
                _this._waveformCtx.fillStyle = _this._data.waveformColor;
                _this._compositeWaveform = new CompositeWaveform_1.CompositeWaveform(waveforms);
                //this._resize();
                _this.fire(_1.Events.WAVEFORM_READY);
            }
        });
    };
    CanvasInstance.prototype._drawWaveform = function () {
        //if (!this._waveformCtx || !this._waveformNeedsRedraw) return;
        if (!this._waveformCtx)
            return;
        var duration;
        var start = 0;
        var end = this._compositeWaveform.duration;
        if (this._data.range) {
            duration = this._data.range.getDuration();
        }
        if (this._data.limitToRange && duration) {
            start = duration.start;
            end = duration.end;
        }
        var startpx = start * this._compositeWaveform.pixelsPerSecond;
        var endpx = end * this._compositeWaveform.pixelsPerSecond;
        var canvasWidth = this._waveformCtx.canvas.width;
        var canvasHeight = this._waveformCtx.canvas.height;
        var barSpacing = this._data.waveformBarSpacing;
        var barWidth = this._data.waveformBarWidth;
        var increment = Math.floor(((endpx - startpx) / canvasWidth) * barSpacing);
        var sampleSpacing = canvasWidth / barSpacing;
        this._waveformCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        this._waveformCtx.fillStyle = this._data.waveformColor;
        for (var x = startpx; x < endpx; x += increment) {
            var maxMin = this._getWaveformMaxAndMin(this._compositeWaveform, x, sampleSpacing);
            var height = this._scaleY(maxMin.max - maxMin.min, canvasHeight);
            var ypos = (canvasHeight - height) / 2;
            var xpos = canvasWidth * Utils_1.AVComponentUtils.normalise(x, startpx, endpx);
            this._waveformCtx.fillRect(xpos, ypos, barWidth, height);
        }
    };
    CanvasInstance.prototype._getWaveformMaxAndMin = function (waveform, index, sampleSpacing) {
        var max = -127;
        var min = 128;
        for (var x = index; x < index + sampleSpacing; x++) {
            if (waveform.max(x) > max) {
                max = waveform.max(x);
            }
            if (waveform.min(x) < min) {
                min = waveform.min(x);
            }
        }
        return { max: max, min: min };
    };
    CanvasInstance.prototype._updateCurrentTimeDisplay = function () {
        var duration;
        if (this._data.range) {
            duration = this._data.range.getDuration();
        }
        if (this._data.limitToRange && duration) {
            var rangeClockTime = this._canvasClockTime - duration.start;
            this._$canvasTime.text(Utils_1.AVComponentUtils.formatTime(rangeClockTime));
        }
        else {
            this._$canvasTime.text(Utils_1.AVComponentUtils.formatTime(this._canvasClockTime));
        }
    };
    CanvasInstance.prototype._updateDurationDisplay = function () {
        var duration;
        if (this._data.range) {
            duration = this._data.range.getDuration();
        }
        if (this._data.limitToRange && duration) {
            this._$canvasDuration.text(Utils_1.AVComponentUtils.formatTime(duration.getLength()));
        }
        else {
            this._$canvasDuration.text(Utils_1.AVComponentUtils.formatTime(this._getDuration()));
        }
    };
    // public setVolume(value: number): void {
    //     //console.log('set volume', (<any>this._data.canvas).id);
    //     this._data.volume = value;
    //     for (let i = 0; i < this._contentAnnotations.length; i++) {
    //         const $mediaElement = this._contentAnnotations[i];
    //         $($mediaElement.element).prop("volume", value);
    //     }
    // }
    CanvasInstance.prototype._renderSyncIndicator = function (mediaElementData) {
        var leftPercent = this._convertToPercentage(mediaElementData.start, this._getDuration());
        var widthPercent = this._convertToPercentage(mediaElementData.end - mediaElementData.start, this._getDuration());
        var $timelineItem = $('<div class="timeline-item" title="' +
            mediaElementData.source +
            '" data-start="' +
            mediaElementData.start +
            '" data-end="' +
            mediaElementData.end +
            '"></div>');
        $timelineItem.css({
            left: leftPercent + "%",
            width: widthPercent + "%"
        });
        var $lineWrapper = $('<div class="line-wrapper"></div>');
        $timelineItem.appendTo($lineWrapper);
        mediaElementData.timelineElement = $timelineItem;
        if (this.$playerElement) {
            this._$timelineItemContainer.append($lineWrapper);
        }
    };
    CanvasInstance.prototype.setCurrentTime = function (seconds) {
        // seconds was originally a string or a number - didn't seem necessary
        // const secondsAsFloat: number = parseFloat(seconds.toString());
        // if (isNaN(secondsAsFloat)) {
        //     return;
        // }
        this._canvasClockTime = seconds; //secondsAsFloat;
        this._canvasClockStartDate = Date.now() - this._canvasClockTime * 1000;
        this.logMessage("SET CURRENT TIME to: " + this._canvasClockTime + " seconds.");
        this._canvasClockUpdater();
        this._highPriorityUpdater();
        this._lowPriorityUpdater();
        this._synchronizeMedia();
    };
    CanvasInstance.prototype.getCurrentTime = function () {
        return this._canvasClockTime;
    };
    CanvasInstance.prototype._rewind = function (withoutUpdate) {
        this.pause();
        var duration;
        if (this._data.range) {
            duration = this._data.range.getDuration();
        }
        if (this._data.limitToRange && duration) {
            this._canvasClockTime = duration.start;
        }
        else {
            this._canvasClockTime = 0;
        }
        if (!this._data.limitToRange) {
            if (this._data && this._data.helper) {
                this.set({
                    range: undefined
                });
            }
        }
    };
    CanvasInstance.prototype._fastforward = function () {
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
        //console.log('playing ', this.getCanvasId());
        var _this = this;
        if (this._isPlaying)
            return;
        var duration;
        if (this._data.range) {
            duration = this._data.range.getDuration();
        }
        if (this._data.limitToRange &&
            duration &&
            this._canvasClockTime >= duration.end) {
            this._canvasClockTime = duration.start;
        }
        if (this._canvasClockTime === this._getDuration()) {
            this._canvasClockTime = 0;
        }
        this._canvasClockStartDate = Date.now() - this._canvasClockTime * 1000;
        this._highPriorityInterval = window.setInterval(function () {
            _this._highPriorityUpdater();
        }, this._highPriorityFrequency);
        this._lowPriorityInterval = window.setInterval(function () {
            _this._lowPriorityUpdater();
        }, this._lowPriorityFrequency);
        this._canvasClockInterval = window.setInterval(function () {
            _this._canvasClockUpdater();
        }, this._canvasClockFrequency);
        this._isPlaying = true;
        if (!withoutUpdate) {
            this._synchronizeMedia();
        }
        var label = this._data && this._data.content ? this._data.content.pause : "";
        this._$playButton.prop("title", label);
        this._$playButton.find("i").switchClass("play", "pause");
        this.fire(CanvasInstanceEvents.PLAYCANVAS);
        this.logMessage("PLAY canvas");
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
        var label = this._data && this._data.content ? this._data.content.play : "";
        this._$playButton.prop("title", label);
        this._$playButton.find("i").switchClass("pause", "play");
        this.fire(CanvasInstanceEvents.PAUSECANVAS);
        this.logMessage("PAUSE canvas");
    };
    CanvasInstance.prototype._isNavigationConstrainedToRange = function () {
        return this._data.constrainNavigationToRange;
    };
    CanvasInstance.prototype._canvasClockUpdater = function () {
        this._canvasClockTime = (Date.now() - this._canvasClockStartDate) / 1000;
        var duration;
        if (this._data.range) {
            duration = this._data.range.getDuration();
        }
        if (this._data.limitToRange &&
            duration &&
            this._canvasClockTime >= duration.end) {
            this.pause();
        }
        if (this._canvasClockTime >= this._getDuration()) {
            this._canvasClockTime = this._getDuration();
            this.pause();
        }
    };
    CanvasInstance.prototype._highPriorityUpdater = function () {
        this._$rangeTimelineContainer.slider({
            value: this._canvasClockTime
        });
        this._$canvasTimelineContainer.slider({
            value: this._canvasClockTime
        });
        this._updateCurrentTimeDisplay();
        this._updateDurationDisplay();
    };
    CanvasInstance.prototype._lowPriorityUpdater = function () {
        this._updateMediaActiveStates();
        if (this._isPlaying &&
            this._data.autoSelectRange &&
            (this.isVirtual() || this.isOnlyCanvasInstance)) {
            this._hasRangeChanged();
        }
    };
    CanvasInstance.prototype._updateMediaActiveStates = function () {
        var contentAnnotation;
        for (var i = 0; i < this._contentAnnotations.length; i++) {
            contentAnnotation = this._contentAnnotations[i];
            if (contentAnnotation.start <= this._canvasClockTime &&
                contentAnnotation.end >= this._canvasClockTime) {
                this._checkMediaSynchronization();
                if (!contentAnnotation.active) {
                    this._synchronizeMedia();
                    contentAnnotation.active = true;
                    contentAnnotation.element.show();
                    contentAnnotation.timelineElement.addClass("active");
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
                    contentAnnotation.timelineElement.removeClass("active");
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
        var contentAnnotation;
        for (var i = 0; i < this._contentAnnotations.length; i++) {
            contentAnnotation = this._contentAnnotations[i];
            this._setMediaCurrentTime(contentAnnotation.element[0], this._canvasClockTime -
                contentAnnotation.start +
                contentAnnotation.startOffset);
            if (contentAnnotation.start <= this._canvasClockTime &&
                contentAnnotation.end >= this._canvasClockTime) {
                if (this._isPlaying) {
                    if (contentAnnotation.element[0].paused) {
                        var promise = contentAnnotation.element[0].play();
                        if (promise) {
                            promise.catch(function () { });
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
        this.logMessage("SYNC MEDIA at: " + this._canvasClockTime + " seconds.");
    };
    CanvasInstance.prototype._checkMediaSynchronization = function () {
        var contentAnnotation;
        for (var i = 0, l = this._contentAnnotations.length; i < l; i++) {
            contentAnnotation = this._contentAnnotations[i];
            if (contentAnnotation.start <= this._canvasClockTime &&
                contentAnnotation.end >= this._canvasClockTime) {
                var correctTime = this._canvasClockTime -
                    contentAnnotation.start +
                    contentAnnotation.startOffset;
                var factualTime = contentAnnotation.element[0].currentTime;
                // off by 0.2 seconds
                if (Math.abs(factualTime - correctTime) > this._mediaSyncMarginSecs) {
                    contentAnnotation.outOfSync = true;
                    //this.playbackStalled(true, contentAnnotation);
                    var lag = Math.abs(factualTime - correctTime);
                    this.logMessage("DETECTED synchronization lag: " + Math.abs(lag));
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
    // private _showWorkingIndicator($targetElement: JQuery): void {
    //     const workingIndicator: JQuery = $('<div class="working-indicator">Waiting...</div>');
    //     if ($targetElement.find('.working-indicator').length == 0) {
    //         $targetElement.append(workingIndicator);
    //     }
    //     //console.log('show working');
    // }
    // private _hideWorkingIndicator() {
    //     $('.workingIndicator').remove();
    //     //console.log('hide working');
    // }
    CanvasInstance.prototype.resize = function () {
        if (this.$playerElement) {
            var containerWidth = this._$canvasContainer.width();
            if (containerWidth) {
                this._$canvasTimelineContainer.width(containerWidth);
                //const resizeFactorY: number = containerWidth / this.canvasWidth;
                //$canvasContainer.height(this.canvasHeight * resizeFactorY);
                var $options = this.$playerElement.find(".options-container");
                // if in the watch metric, make sure the canvasContainer isn't more than half the height to allow
                // room between buttons
                if (this._data.halveAtWidth !== undefined &&
                    this.$playerElement.parent().width() < this._data.halveAtWidth) {
                    this._$canvasContainer.height(this.$playerElement.parent().height() / 2);
                }
                else {
                    this._$canvasContainer.height(this.$playerElement.parent().height() -
                        $options.height());
                }
            }
            if (this._waveformCanvas) {
                var canvasWidth = this._$canvasContainer.width();
                var canvasHeight = this._$canvasContainer.height();
                this._waveformCanvas.width = canvasWidth;
                this._waveformCanvas.height = canvasHeight;
            }
            this._render();
        }
    };
    return CanvasInstance;
}(base_component_1.BaseComponent));
exports.CanvasInstance = CanvasInstance;
var CanvasInstanceEvents = /** @class */ (function () {
    function CanvasInstanceEvents() {
    }
    CanvasInstanceEvents.NEXT_RANGE = "nextrange";
    CanvasInstanceEvents.PAUSECANVAS = "pause";
    CanvasInstanceEvents.PLAYCANVAS = "play";
    CanvasInstanceEvents.PREVIOUS_RANGE = "previousrange";
    return CanvasInstanceEvents;
}());
exports.CanvasInstanceEvents = CanvasInstanceEvents;
//# sourceMappingURL=CanvasInstance.js.map