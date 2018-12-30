import { Canvas, Range, Duration, ExternalResourceType, Behavior, MediaType, Annotation, AnnotationBody, Utils } from "manifesto.js";

namespace IIIFComponents {

    export interface IAVCanvasInstanceData extends IAVComponentData {
        canvas?: Canvas | VirtualCanvas;
        range?: Range;
        visible?: boolean;
        volume?: number;
    }

    export interface IAVComponentContent {
        currentTime: string;
        collapse: string;
        duration: string;
        expand: string;
        mute: string;
        next: string;
        pause: string;
        play: string;
        previous: string;
        unmute: string;
    }
    
    export interface IAVComponentData {
        [key: string]: any;
        adaptiveAuthEnabled?: boolean;
        autoPlay?: boolean;
        autoSelectRange?: boolean;
        canvasId?: string;
        constrainNavigationToRange?: boolean;
        content?: IAVComponentContent;
        defaultAspectRatio?: number;
        doubleClickMS?: number;
        helper?: Manifold.IHelper;
        halveAtWidth?: number;
        limitToRange?: boolean;
        posterImageRatio?: number;
        rangeId?: string;
        virtualCanvasEnabled?: boolean;
        waveformBarSpacing?: number; 
        waveformBarWidth?: number;
        waveformColor?: string;
    }

    export interface IAVVolumeControlState {
        volume?: number;
    }

    export interface IMaxMin {
        max: number;
        min: number;
    }

    export class AVVolumeControl extends _Components.BaseComponent {
        
        private _$volumeSlider: JQuery;
        private _$volumeMute: JQuery;

        private _lastVolume: number = 1;

        private _data: IAVVolumeControlState = {
            volume: 1
        };

        constructor(options: _Components.IBaseComponentOptions) {
            super(options);

            this._init();
            this._resize();
        }

        protected _init(): boolean {
            const success: boolean = super._init();

            if (!success) {
                console.error("Component failed to initialise");
            }

            this._$volumeMute = $(`
                                <button class="btn volume-mute" title="${this.options.data.content.mute}">
                                    <i class="av-icon av-icon-mute on" aria-hidden="true"></i>${this.options.data.content.mute}
                                </button>`);

            this._$volumeSlider = $('<div class="volume-slider"></div>');

            this._$element.append(this._$volumeMute, this._$volumeSlider);

            const that = this;

            this._$volumeMute.on('touchstart click', (e) => {

                e.preventDefault();

                // start reducer
                if (this._data.volume !== 0) {
                    // mute
                    this._lastVolume = <number>this._data.volume;
                    this._data.volume = 0;
                } else {
                    // unmute
                    this._data.volume = this._lastVolume;
                }
                // end reducer

                this.fire(VolumeEvents.VOLUME_CHANGED, this._data.volume);
            });

            this._$volumeSlider.slider({
                value: that._data.volume,
                step: 0.1,
                orientation: "horizontal",
                range: "min",
                min: 0,
                max: 1,
                animate: false,
                create: function (evt: any, ui: any) {
 
                },
                slide: function (evt: any, ui: any) {

                    // start reducer
                    that._data.volume = ui.value;
    
                    if (that._data.volume === 0) {
                        that._lastVolume = 0;
                    }
                    // end reducer
    
                    that.fire(VolumeEvents.VOLUME_CHANGED, that._data.volume);
                    
                },
                stop: function (evt: any, ui: any) {

                }
            });

            return success;
        }

        public set(data: IAVVolumeControlState): void {
            this._data = Object.assign(this._data, data);

            this._render();
        }

        private _render(): void {

            if (this._data.volume !== undefined) {

                this._$volumeSlider.slider({
                    value: this._data.volume
                });
    
                if (this._data.volume === 0) {
                    const label: string = this.options.data.content.unmute;
                    this._$volumeMute.prop('title', label);
                    this._$volumeMute.find('i').switchClass('on', 'off');                
                } else {
                    const label: string = this.options.data.content.mute;
                    this._$volumeMute.prop('title', label);
                    this._$volumeMute.find('i').switchClass('off', 'on');
                }
            }            
        }

        protected _resize(): void {

        }
    }

    export class VolumeEvents {
        static VOLUME_CHANGED: string = 'volumechanged';
    }

    export class CanvasInstance extends _Components.BaseComponent {

        private _$canvasContainer: JQuery;
        private _$canvasDuration: JQuery;
        private _$canvasHoverHighlight: JQuery;
        private _$canvasHoverPreview: JQuery;
        private _$canvasTime: JQuery;
        private _$canvasTimelineContainer: JQuery;
        private _$controlsContainer: JQuery;
        private _$durationHighlight: JQuery;
        private _$hoverPreviewTemplate: JQuery;
        private _$nextButton: JQuery;
        private _$optionsContainer: JQuery;
        private _$playButton: JQuery;
        private _$prevButton: JQuery;
        private _$rangeHoverHighlight: JQuery;
        private _$rangeHoverPreview: JQuery;
        private _$rangeTimelineContainer: JQuery;
        private _$timeDisplay: JQuery;
        private _$timelineItemContainer: JQuery;
        private _canvasClockFrequency: number = 25;
        private _canvasClockInterval: number;
        private _canvasClockStartDate: number = 0;
        private _canvasClockTime: number = 0;
        private _canvasHeight: number = 0;
        private _canvasWidth: number = 0;
        private _compositeWaveform: CompositeWaveform;
        private _contentAnnotations: any[]; // todo: type as HTMLMediaElement?
        private _data: IAVCanvasInstanceData = this.data();
        private _highPriorityFrequency: number = 25;
        private _highPriorityInterval: number;
        private _isPlaying: boolean = false;
        private _isStalled: boolean = false;
        //private _lastCanvasHeight: number | undefined;
        //private _lastCanvasWidth: number | undefined;
        private _lowPriorityFrequency: number = 250;
        private _lowPriorityInterval: number;
        private _mediaSyncMarginSecs: number = 1;
        private _rangeSpanPadding: number = 0.25;
        private _readyMediaCount: number = 0;
        private _stallRequestedBy: any[] = []; //todo: type
        private _volume: AVVolumeControl;
        private _wasPlaying: boolean = false;
        private _waveformCanvas: HTMLCanvasElement | null;
        private _waveformCtx: CanvasRenderingContext2D | null;
        //private _waveformNeedsRedraw: boolean = true;
        public ranges: Range[] = [];
        public waveforms: string[] = [];

        public $playerElement: JQuery;
        public isOnlyCanvasInstance: boolean = false;
        public logMessage: (message: string) => void;

        constructor(options: _Components.IBaseComponentOptions) {
            super(options);
            this._data = this.options.data;
            this.$playerElement = $('<div class="player"></div>');
        }

        public init() {

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
            this._$prevButton = $(`
                                <button class="btn" title="${this._data.content.previous}">
                                    <i class="av-icon av-icon-previous" aria-hidden="true"></i>${this._data.content.previous}
                                </button>`);
            this._$playButton = $(`
                                <button class="btn" title="${this._data.content.play}">
                                    <i class="av-icon av-icon-play play" aria-hidden="true"></i>${this._data.content.play}
                                </button>`);
            this._$nextButton = $(`
                                <button class="btn" title="${this._data.content.next}">
                                    <i class="av-icon av-icon-next" aria-hidden="true"></i>${this._data.content.next}
                                </button>`);
            this._$timeDisplay = $('<div class="time-display"><span class="canvas-time"></span> / <span class="canvas-duration"></span></div>');
            this._$canvasTime = this._$timeDisplay.find('.canvas-time');
            this._$canvasDuration = this._$timeDisplay.find('.canvas-duration');

            if (this.isVirtual()) {
                this.$playerElement.addClass('virtual');
            }

            const $volume: JQuery = $('<div class="volume"></div>');
            this._volume = new AVVolumeControl({
                target: $volume[0],
                data: Object.assign({}, this._data)
            });

            this._volume.on(VolumeEvents.VOLUME_CHANGED, (value: number) => {
                this.fire(VolumeEvents.VOLUME_CHANGED, value);
            }, false);

            this._$controlsContainer.append(this._$prevButton, this._$playButton, this._$nextButton, this._$timeDisplay, $volume);
            this._$canvasTimelineContainer.append(this._$canvasHoverPreview, this._$canvasHoverHighlight, this._$durationHighlight);
            this._$rangeTimelineContainer.append(this._$rangeHoverPreview, this._$rangeHoverHighlight);
            this._$optionsContainer.append(this._$canvasTimelineContainer, this._$rangeTimelineContainer, this._$timelineItemContainer, this._$controlsContainer);
            this.$playerElement.append(this._$canvasContainer, this._$optionsContainer);

            this._$canvasHoverPreview.hide();
            this._$rangeHoverPreview.hide();

            if (this._data && this._data.helper && this._data.canvas) {

                let ranges: Range[] = [];

                // if the canvas is virtual, get the ranges for all sub canvases
                if (this.isVirtual()) {
                    (<VirtualCanvas>this._data.canvas).canvases.forEach((canvas: Canvas) => {
                        if (this._data && this._data.helper) {
                            let r: Range[] = this._data.helper.getCanvasRanges(canvas);

                            let clonedRanges: Range[] = [];

                            // shift the range targets forward by the duration of their previous canvases
                            r.forEach((range: Range) => {

                                const clonedRange = jQuery.extend(true, {}, range);
                                clonedRanges.push(clonedRange);

                                if (clonedRange.canvases && clonedRange.canvases.length) {

                                    for (let i = 0; i < clonedRange.canvases.length; i++) {
                                        clonedRange.canvases[i] = <string>AVComponentUtils.retargetTemporalComponent((<VirtualCanvas>this._data.canvas).canvases, clonedRange.__jsonld.items[i].id);
                                    }

                                }
                            });

                            ranges.push(...clonedRanges);
                        }
                    });
                } else {
                    ranges = ranges.concat(this._data.helper.getCanvasRanges(this._data.canvas as Canvas));
                }

                ranges.forEach((range: Range) => {
                    this.ranges.push(range);
                });
            }

            const canvasWidth: number = this._data.canvas.getWidth();
            const canvasHeight: number = this._data.canvas.getHeight();

            if (!canvasWidth) {
                this._canvasWidth = <number>this.$playerElement.parent().width(); // this._data.defaultCanvasWidth;
            } else {
                this._canvasWidth = canvasWidth;
            }

            if (!canvasHeight) {
                this._canvasHeight = this._canvasWidth * <number>this._data.defaultAspectRatio; //this._data.defaultCanvasHeight;
            } else {
                this._canvasHeight = canvasHeight;
            }

            const that = this;

            let prevClicks: number = 0;
            let prevTimeout: number = 0;

            this._$prevButton.on('touchstart click', (e) => {

                e.preventDefault();

                prevClicks++;

                if (prevClicks === 1) {
                    // single click
                    //console.log('single');
                    this._previous(false);
                    prevTimeout = setTimeout(() => {
                        prevClicks = 0;
                        prevTimeout = 0;
                    }, this._data.doubleClickMS);
                } else {
                    // double click
                    //console.log('double');
                    this._previous(true);
                    clearTimeout(prevTimeout);
                    prevClicks = 0;
                    prevTimeout = 0;
                }
            });

            this._$playButton.on('touchstart click', (e) => {

                e.preventDefault();

                if (this._isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            });

            this._$nextButton.on('touchstart click', (e) => {

                e.preventDefault();

                this._next();
            });

            this._$canvasTimelineContainer.slider({
                value: 0,
                step: 0.01,
                orientation: "horizontal",
                range: "min",
                max: that._getDuration(),
                animate: false,
                create: function (evt: any, ui: any) {
                    // on create
                },
                slide: function (evt: any, ui: any) {
                    that._setCurrentTime(ui.value);
                },
                stop: function (evt: any, ui: any) {
                    //this._setCurrentTime(ui.value);
                }
            });

            this._$canvasTimelineContainer.mouseout(() => {
                that._$canvasHoverHighlight.width(0);
                that._$canvasHoverPreview.hide();
            });

            this._$rangeTimelineContainer.mouseout(() => {
                that._$rangeHoverHighlight.width(0);
                that._$rangeHoverPreview.hide();
            });

            this._$canvasTimelineContainer.on("mousemove", (e) => {
                this._updateHoverPreview(e, this._$canvasTimelineContainer, this._getDuration());
            });

            this._$rangeTimelineContainer.on("mousemove", (e) => {
                if (this._data.range) {
                    const duration: Duration | undefined = this._data.range.getDuration();
                    this._updateHoverPreview(e, this._$rangeTimelineContainer, duration ? duration.getLength() : 0);
                }
            });

            // create annotations

            this._contentAnnotations = [];

            const items: Annotation[] = this._data.canvas.getContent();// (<any>this._data.canvas).__jsonld.content[0].items;

            // always hide timelineItemContainer for now
            //if (items.length === 1) {
            this._$timelineItemContainer.hide();
            //}

            for (let i = 0; i < items.length; i++) {

                const item: Annotation = items[i];

                /*
                if (item.motivation != 'painting') {
                    return null;
                }
                */

                let mediaSource: any;
                const bodies: AnnotationBody[] = item.getBody();

                if (!bodies.length) {
                    console.warn('item has no body');
                    return;
                }

                const body: AnnotationBody | null = this._getBody(bodies);

                if (!body) {
                    // if no suitable format was found for the current browser, skip this item.
                    console.warn('unable to find suitable format for', item.id);
                    continue;
                }

                const type: ExternalResourceType | null = body.getType();
                const format: MediaType | null = body.getFormat();

                // if (type && type.toString() === 'choice') {
                //     // Choose first "Choice" item as body
                //     const tmpItem = item;
                //     item.body = tmpItem.body[0].items[0];
                //     mediaSource = item.body.id.split('#')[0];
                // } else 

                if (type && type.toString() === 'textualbody') {
                    //mediaSource = (<any>body).value;
                } else {
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

                const target: string | null = item.getTarget();

                if (!target) {
                    console.warn('item has no target');
                    return;
                }

                let xywh: number[] | null = AVComponentUtils.getSpatialComponent(target);
                let t: number[] | null = Utils.getTemporalComponent(target);

                if (!xywh) {
                    xywh = [0, 0, this._canvasWidth, this._canvasHeight];
                }

                if (!t) {
                    t = [0, this._getDuration()];
                }

                const positionLeft = parseInt(String(xywh[0])),
                    positionTop = parseInt(String(xywh[1])),
                    mediaWidth = parseInt(String(xywh[2])),
                    mediaHeight = parseInt(String(xywh[3])),
                    startTime = parseInt(String(t[0])),
                    endTime = parseInt(String(t[1]));

                const percentageTop = this._convertToPercentage(positionTop, this._canvasHeight),
                    percentageLeft = this._convertToPercentage(positionLeft, this._canvasWidth),
                    percentageWidth = this._convertToPercentage(mediaWidth, this._canvasWidth),
                    percentageHeight = this._convertToPercentage(mediaHeight, this._canvasHeight);

                const temporalOffsets: RegExpExecArray | null = /t=([^&]+)/g.exec(body.id);

                let ot;

                if (temporalOffsets && temporalOffsets[1]) {
                    ot = temporalOffsets[1].split(',');
                } else {
                    ot = [null, null];
                }

                const offsetStart = (ot[0]) ? parseInt(<string>ot[0]) : ot[0],
                    offsetEnd = (ot[1]) ? parseInt(<string>ot[1]) : ot[1];

                // todo: type this
                const itemData: any = {
                    'active': false,
                    'end': endTime,
                    'endOffset': offsetEnd,
                    'format': format,
                    'height': percentageHeight,
                    'left': percentageLeft,
                    'source': mediaSource,
                    'start': startTime,
                    'startOffset': offsetStart,
                    'top': percentageTop,
                    'type': type,
                    'width': percentageWidth
                }

                this._renderMediaElement(itemData);

                // waveform

                // todo: create annotation.getSeeAlso
                const seeAlso: any = item.getProperty('seeAlso');

                if (seeAlso && seeAlso.length) {
                    const dat: string = seeAlso[0].id;
                    this.waveforms.push(dat);
                }

            }

            this._renderWaveform();
        }

        private _getBody(bodies: AnnotationBody[]): AnnotationBody | null {

            // if there's an HLS format and HLS is supported in this browser
            for (let i = 0; i < bodies.length; i++) {
                const body: AnnotationBody = bodies[i];
                const format: MediaType | null = body.getFormat();

                if (format) {
                    if (AVComponentUtils.isHLSFormat(format) && AVComponentUtils.canPlayHls()) {
                        return body;
                    }
                }
            }

            // if there's a Dash format and the browser isn't Safari
            for (let i = 0; i < bodies.length; i++) {
                const body: AnnotationBody = bodies[i];
                const format: MediaType | null = body.getFormat();

                if (format) {
                    if (AVComponentUtils.isMpegDashFormat(format) && !AVComponentUtils.isSafari()) {
                        return body;
                    }
                }
            }

            // otherwise, return the first format that isn't HLS or Dash
            for (let i = 0; i < bodies.length; i++) {
                const body: AnnotationBody = bodies[i];
                const format: MediaType | null = body.getFormat();

                if (format) {
                    if (!AVComponentUtils.isHLSFormat(format) && !AVComponentUtils.isMpegDashFormat(format)) {
                        return body;
                    }
                }
            }

            // couldn't find a suitable format
            return null;
        }

        private _getDuration(): number {
            if (this._data && this._data.canvas) {
                return <number>this._data.canvas.getDuration();
            }

            return 0;
        }

        public data(): IAVCanvasInstanceData {
            return <IAVCanvasInstanceData>{
                waveformColor: "#fff",
                waveformBarSpacing: 4,
                waveformBarWidth: 2,
                volume: 1
            }
        }

        public isVirtual(): boolean {
            return this._data.canvas instanceof VirtualCanvas;
        }

        public isVisible(): boolean {
            return !!this._data.visible;
        }

        public includesVirtualSubCanvas(canvasId: string): boolean {
            if (this.isVirtual() && this._data.canvas && (<VirtualCanvas>this._data.canvas).canvases) {
                for (let i = 0; i < (<VirtualCanvas>this._data.canvas).canvases.length; i++) {
                    const canvas: Canvas = (<VirtualCanvas>this._data.canvas).canvases[i];
                    if (Utils.normaliseUrl(canvas.id) === canvasId) {
                        return true;
                    }
                }
            }

            return false;
        }

        public set(data: IAVCanvasInstanceData): void {

            const oldData: IAVCanvasInstanceData = Object.assign({}, this._data);
            this._data = Object.assign(this._data, data);
            const diff: string[] = AVComponentUtils.diff(oldData, this._data);

            if (diff.includes('visible')) {

                if (this._data.canvas) {
                    if (this._data.visible) {
                        this._rewind();
                        this.$playerElement.show();
                        //console.log('show ' + this._data.canvas.id);
                    } else {
                        this.$playerElement.hide();
                        this.pause();
                        //console.log('hide ' + this._data.canvas.id);
                    }

                    this.resize();
                }
            }

            if (diff.includes('range')) {

                if (this._data.helper) {

                    if (!this._data.range) {
                        this.fire(AVComponent.Events.RANGE_CHANGED, null);
                    } else {

                        const duration: Duration | undefined = this._data.range.getDuration();

                        if (duration) {

                            if (!(<any>this._data.range).autoChanged) {
                                this._setCurrentTime(duration.start);
                            }

                            if (this._data.autoPlay) {
                                this.play();
                            }

                            this.fire(AVComponent.Events.RANGE_CHANGED, this._data.range.id);
                        }
                    }
                }

            }

            if (diff.includes('volume')) {
                this._contentAnnotations.forEach(($mediaElement: any) => {

                    const volume: number = (this._data.volume !== undefined) ? this._data.volume : 1;

                    $($mediaElement.element).prop('volume', volume);

                    this._volume.set({
                        volume: this._data.volume
                    });
                });
            } else {
                this._render();
            }

            if (diff.includes('limitToRange')) {
                this._render();
            }

        }

        private _hasRangeChanged(): void {

            const range: Range | undefined = this._getRangeForCurrentTime();

            if (range && !this._data.limitToRange && (!this._data.range || (this._data.range && range.id !== this._data.range.id))) {

                this.set({
                    range: jQuery.extend(true, { autoChanged: true }, range)
                });

            }
        }

        private _getRangeForCurrentTime(parentRange?: Range): Range | undefined {

            let ranges: Range[];

            if (!parentRange) {
                ranges = this.ranges;
            } else {
                ranges = parentRange.getRanges();
            }

            for (let i = 0; i < ranges.length; i++) {

                const range: Range = ranges[i];

                // if the range spans the current time, and is navigable, return it.
                // otherwise, try to find a navigable child range.
                if (this._rangeSpansCurrentTime(range)) {

                    if (this._rangeNavigable(range)) {
                        return range;
                    }

                    const childRanges: Range[] = range.getRanges();

                    // if a child range spans the current time, recurse into it
                    for (let i = 0; i < childRanges.length; i++) {
                        const childRange: Range = childRanges[i];

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
        }

        private _rangeSpansCurrentTime(range: Range): boolean {

            if (range.spansTime(Math.ceil(this._canvasClockTime) + this._rangeSpanPadding)) {
                return true;
            }

            return false;
        }

        private _rangeNavigable(range: Range): boolean {

            const behavior: Behavior | null = range.getBehavior();

            if (behavior && behavior.toString() === Behavior.NO_NAV) {
                return false;
            }

            return true;
        }

        private _render(): void {

            if (this._data.range) {

                const duration: Duration | undefined = this._data.range.getDuration();

                if (duration) {

                    // get the total length in seconds.
                    const totalLength: number = this._getDuration();

                    // get the length of the timeline container
                    const timelineLength: number = <number>this._$canvasTimelineContainer.width();

                    // get the ratio of seconds to length
                    const ratio: number = timelineLength / totalLength;
                    const start: number = duration.start * ratio;
                    let end: number = duration.end * ratio;

                    // if the end is on the next canvas
                    if (end > totalLength || end < start) {
                        end = totalLength;
                    }

                    const width: number = end - start;

                    //console.log(width);

                    if (this.isVirtual() || this.isOnlyCanvasInstance) {
                        this._$durationHighlight.show();
                        // set the start position and width
                        this._$durationHighlight.css({
                            left: start,
                            width: width
                        });
                    } else {
                        this._$durationHighlight.hide();
                    }

                    const that = this;

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
                        create: function (evt: any, ui: any) {
                            // on create
                        },
                        slide: function (evt: any, ui: any) {
                            that._setCurrentTime(ui.value);
                        },
                        stop: function (evt: any, ui: any) {
                            //this._setCurrentTime(ui.value);
                        }
                    });

                }

            } else {
                this._$durationHighlight.hide();
            }

            if (this._data.limitToRange && this._data.range) {
                this._$canvasTimelineContainer.hide();
                this._$rangeTimelineContainer.show();
            } else {
                this._$canvasTimelineContainer.show();
                this._$rangeTimelineContainer.hide();
            }

            this._updateCurrentTimeDisplay();
            this._updateDurationDisplay();
            this._drawWaveform();
        }

        public getCanvasId(): string | undefined {

            if (this._data && this._data.canvas) {
                return this._data.canvas.id;
            }

            return undefined;
        }

        private _updateHoverPreview(e: any, $container: JQuery, duration: number): void {
            const offset = <any>$container.offset();

            const x = e.pageX - offset.left;

            const $hoverArrow: JQuery = $container.find('.arrow');
            const $hoverHighlight: JQuery = $container.find('.hover-highlight');
            const $hoverPreview: JQuery = $container.find('.hover-preview');

            $hoverHighlight.width(x);

            const fullWidth: number = <number>$container.width();
            const ratio: number = x / fullWidth;
            const seconds: number = Math.min(duration * ratio);
            $hoverPreview.find('.label').text(AVComponentUtils.formatTime(seconds));
            const hoverPreviewWidth: number = <number>$hoverPreview.outerWidth();
            const hoverPreviewHeight: number = <number>$hoverPreview.outerHeight();

            let left: number = x - hoverPreviewWidth * 0.5;
            let arrowLeft: number = hoverPreviewWidth * 0.5 - 6;

            if (left < 0) {
                left = 0;
                arrowLeft = x - 6;
            }

            if (left + hoverPreviewWidth > fullWidth) {
                left = fullWidth - hoverPreviewWidth;
                arrowLeft = (hoverPreviewWidth - (fullWidth - x)) - 6;
            }

            $hoverPreview.css({
                left: left,
                top: hoverPreviewHeight * -1 + 'px'
            }).show();

            $hoverArrow.css({
                left: arrowLeft
            });
        }

        private _previous(isDouble: boolean): void {
            if (this._data.limitToRange) {
                // if only showing the range, single click rewinds, double click goes to previous range unless navigation is contrained to range
                if (isDouble) {
                    if (this._isNavigationConstrainedToRange()) {
                        this._rewind();
                    } else {
                        this.fire(CanvasInstanceEvents.PREVIOUS_RANGE);
                    }
                } else {
                    this._rewind();
                }
            } else {
                // not limited to range. 
                // if there is a currentDuration, single click goes to previous range, double click clears current duration and rewinds.
                // if there is no currentDuration, single and double click rewinds.
                if (this._data.range) {
                    if (isDouble) {
                        this.set({
                            range: undefined
                        });
                        this._rewind();
                    } else {
                        this.fire(CanvasInstanceEvents.PREVIOUS_RANGE);
                    }
                } else {
                    this._rewind();
                }
            }
        }

        private _next(): void {
            if (this._data.limitToRange) {
                if (this._isNavigationConstrainedToRange()) {
                    this._fastforward();
                } else {
                    this.fire(CanvasInstanceEvents.NEXT_RANGE);
                }
            } else {
                this.fire(CanvasInstanceEvents.NEXT_RANGE);
            }
        }

        public destroy(): void {
            window.clearInterval(this._highPriorityInterval);
            window.clearInterval(this._lowPriorityInterval);
            window.clearInterval(this._canvasClockInterval);
        }

        private _convertToPercentage(pixelValue: number, maxValue: number): number {
            const percentage: number = (pixelValue / maxValue) * 100;
            return percentage;
        }

        private _renderMediaElement(data: any): void {

            let $mediaElement;
            let type: string = data.type.toString().toLowerCase();

            switch (type) {
                case 'video':
                    $mediaElement = $('<video class="anno" />');
                    break;
                case 'sound':
                case 'audio':
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

            const media: HTMLMediaElement = $mediaElement[0] as HTMLMediaElement;

            if (data.format && data.format.toString() === 'application/dash+xml') {
                // dash
                $mediaElement.attr('data-dashjs-player', '');
                const player = dashjs.MediaPlayer().create();
                player.getDebug().setLogToBrowserConsole(false);
                if (this._data.adaptiveAuthEnabled) {
                    player.setXHRWithCredentialsForType('MPD', true); // send cookies
                }
                player.initialize(media, data.source);
            } else if (data.format && data.format.toString() === 'application/vnd.apple.mpegurl') {
                // hls
                if (Hls.isSupported()) {
                    let hls = new Hls();

                    if (this._data.adaptiveAuthEnabled) {
                        hls = new Hls({
                            xhrSetup: (xhr: any) => {
                                xhr.withCredentials = true; // send cookies
                            }
                        });
                    } else {
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
                else if (media.canPlayType('application/vnd.apple.mpegurl')) {
                    media.src = data.source;
                    //media.addEventListener('canplay', function () {
                    //media.play();
                    //});
                }
            } else {
                $mediaElement.attr('src', data.source);
            }

            $mediaElement.css({
                top: data.top + '%',
                left: data.left + '%',
                width: data.width + '%',
                height: data.height + '%'
            }).hide();

            data.element = $mediaElement;


            data.timeout = null;

            const that = this;

            data.checkForStall = function () {

                const self = this;

                if (this.active) {
                    that._checkMediaSynchronization();
                    if (this.element.get(0).readyState > 0 && !this.outOfSync) {
                        that._playbackStalled(false, self);
                    } else {
                        that._playbackStalled(true, self);
                        if (this.timeout) {
                            window.clearTimeout(this.timeout);
                        }
                        this.timeout = window.setTimeout(function () {
                            self.checkForStall();
                        }, 1000);
                    }

                } else {
                    that._playbackStalled(false, self);
                }

            }

            this._contentAnnotations.push(data);

            if (this.$playerElement) {
                this._$canvasContainer.append($mediaElement);
            }

            $mediaElement.on('loadstart', () => {
                //console.log('loadstart');
                //data.checkForStall();
            });

            $mediaElement.on('waiting', () => {
                //console.log('waiting');
                //data.checkForStall();
            });

            $mediaElement.on('seeking', () => {
                //console.log('seeking');
                //data.checkForStall();
            });

            $mediaElement.on('loadedmetadata', () => {
                this._readyMediaCount++;

                if (this._readyMediaCount === this._contentAnnotations.length) {

                    //if (!this._data.range) {
                    this._setCurrentTime(0);
                    //}                        

                    if (this._data.autoPlay) {
                        this.play();
                    }

                    this._updateDurationDisplay();

                    this.fire(AVComponent.Events.MEDIA_READY);
                }
            });

            $mediaElement.attr('preload', 'auto');

            (<any>$mediaElement.get(0)).load();

            this._renderSyncIndicator(data);
        }

        private _getWaveformData(url: string): Promise<any> {

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

                $.ajax(<any>{
                    url: url,
                    type: 'GET',
                    dataType: 'binary',
                    responseType: 'arraybuffer',
                    processData: false
                }).done(function (data) {
                    resolve(WaveformData.create(data));
                }).fail(function (err) {
                    reject(new Error('Network Error'));
                });

            });
        }

        private _renderWaveform(): void {

            if (!this.waveforms.length) return;

            const promises = this.waveforms.map((url) => {
                return this._getWaveformData(url);
            });

            Promise.all(promises).then((waveforms) => {

                this._waveformCanvas = document.createElement('canvas');
                this._waveformCanvas.classList.add('waveform');
                this._$canvasContainer.append(this._waveformCanvas);
                this._waveformCtx = this._waveformCanvas.getContext('2d');

                if (this._waveformCtx) {
                    this._waveformCtx.fillStyle = <string>this._data.waveformColor;
                    this._compositeWaveform = new CompositeWaveform(waveforms);
                    //this._resize();
                    this.fire(AVComponent.Events.WAVEFORM_READY);
                }

            });
        }

        private _drawWaveform(): void {

            //if (!this._waveformCtx || !this._waveformNeedsRedraw) return;
            if (!this._waveformCtx) return;

            let duration: Duration | undefined;
            let start: number = 0;
            let end: number = this._compositeWaveform.duration;

            if (this._data.range) {
                duration = this._data.range.getDuration();
            }

            if (this._data.limitToRange && duration) {
                start = duration.start;
                end = duration.end;
            }

            const startpx = start * this._compositeWaveform.pixelsPerSecond;
            const endpx = end * this._compositeWaveform.pixelsPerSecond;
            const canvasWidth: number = this._waveformCtx.canvas.width;
            const canvasHeight: number = this._waveformCtx.canvas.height;
            const barSpacing: number = <number>this._data.waveformBarSpacing;
            const barWidth: number = <number>this._data.waveformBarWidth;
            const increment: number = Math.floor(((endpx - startpx) / canvasWidth) * barSpacing);
            const sampleSpacing: number = (canvasWidth / barSpacing);

            this._waveformCtx.clearRect(0, 0, canvasWidth, canvasHeight);
            this._waveformCtx.fillStyle = <string>this._data.waveformColor;

            for (let x = startpx; x < endpx; x += increment) {

                const maxMin = this._getWaveformMaxAndMin(this._compositeWaveform, x, sampleSpacing);
                const height = this._scaleY(maxMin.max - maxMin.min, canvasHeight);
                const ypos = (canvasHeight - height) / 2;
                const xpos = canvasWidth * AVComponentUtils.normalise(x, startpx, endpx);

                this._waveformCtx.fillRect(xpos, ypos, barWidth, height);
            }
        }

        private _scaleY = (amplitude: number, height: number) => {
            const range = 256;
            return Math.max(<number>this._data.waveformBarWidth, (amplitude * height / range));
        };

        private _getWaveformMaxAndMin(waveform: CompositeWaveform, index: number, sampleSpacing: number): IMaxMin {

            let max: number = -127;
            let min: number = 128;

            for (let x = index; x < index + sampleSpacing; x++) {

                if (waveform.max(x) > max) {
                    max = waveform.max(x);
                }

                if (waveform.min(x) < min) {
                    min = waveform.min(x);
                }
            }

            return { max, min };
        }

        private _updateCurrentTimeDisplay(): void {

            let duration: Duration | undefined;

            if (this._data.range) {
                duration = this._data.range.getDuration();
            }

            if (this._data.limitToRange && duration) {
                const rangeClockTime: number = this._canvasClockTime - duration.start;
                this._$canvasTime.text(AVComponentUtils.formatTime(rangeClockTime));
            } else {
                this._$canvasTime.text(AVComponentUtils.formatTime(this._canvasClockTime));
            }
        }

        private _updateDurationDisplay(): void {

            let duration: Duration | undefined;

            if (this._data.range) {
                duration = this._data.range.getDuration();
            }

            if (this._data.limitToRange && duration) {
                this._$canvasDuration.text(AVComponentUtils.formatTime(duration.getLength()));
            } else {
                this._$canvasDuration.text(AVComponentUtils.formatTime(this._getDuration()));
            }
        }

        // public setVolume(value: number): void {
        //     //console.log('set volume', (<any>this._data.canvas).id);
        //     this._data.volume = value;
        //     for (let i = 0; i < this._contentAnnotations.length; i++) {
        //         const $mediaElement = this._contentAnnotations[i];
        //         $($mediaElement.element).prop("volume", value);
        //     }
        // }

        private _renderSyncIndicator(mediaElementData: any) {

            const leftPercent: number = this._convertToPercentage(mediaElementData.start, this._getDuration());
            const widthPercent: number = this._convertToPercentage(mediaElementData.end - mediaElementData.start, this._getDuration());

            const $timelineItem: JQuery = $('<div class="timeline-item" title="' + mediaElementData.source + '" data-start="' + mediaElementData.start + '" data-end="' + mediaElementData.end + '"></div>');

            $timelineItem.css({
                left: leftPercent + '%',
                width: widthPercent + '%'
            });

            const $lineWrapper: JQuery = $('<div class="line-wrapper"></div>');

            $timelineItem.appendTo($lineWrapper);

            mediaElementData.timelineElement = $timelineItem;

            if (this.$playerElement) {
                this._$timelineItemContainer.append($lineWrapper);
            }
        }

        private _setCurrentTime(seconds: number): void { // seconds was originally a string or a number - didn't seem necessary

            // const secondsAsFloat: number = parseFloat(seconds.toString());

            // if (isNaN(secondsAsFloat)) {
            //     return;
            // }

            this._canvasClockTime = seconds; //secondsAsFloat;
            this._canvasClockStartDate = Date.now() - (this._canvasClockTime * 1000);

            this.logMessage('SET CURRENT TIME to: ' + this._canvasClockTime + ' seconds.');

            this._canvasClockUpdater();
            this._highPriorityUpdater();
            this._lowPriorityUpdater();
            this._synchronizeMedia();
        }

        private _rewind(withoutUpdate?: boolean): void {

            this.pause();

            let duration: Duration | undefined;

            if (this._data.range) {
                duration = this._data.range.getDuration();
            }

            if (this._data.limitToRange && duration) {
                this._canvasClockTime = duration.start;
            } else {
                this._canvasClockTime = 0;
            }

            if (!this._data.limitToRange) {
                if (this._data && this._data.helper) {
                    this.set({
                        range: undefined
                    });
                }
            }
        }

        private _fastforward(): void {

            let duration: Duration | undefined;

            if (this._data.range) {
                duration = this._data.range.getDuration();
            }

            if (this._data.limitToRange && duration) {
                this._canvasClockTime = duration.end;
            } else {
                this._canvasClockTime = this._getDuration();
            }

            this.pause();
        }

        // todo: can this be part of the _data state?
        // this._data.play = true?
        public play(withoutUpdate?: boolean): void {

            //console.log('playing ', this.getCanvasId());

            if (this._isPlaying) return;

            let duration: Duration | undefined;

            if (this._data.range) {
                duration = this._data.range.getDuration();
            }

            if (this._data.limitToRange && duration && this._canvasClockTime >= duration.end) {
                this._canvasClockTime = duration.start;
            }

            if (this._canvasClockTime === this._getDuration()) {
                this._canvasClockTime = 0;
            }

            this._canvasClockStartDate = Date.now() - (this._canvasClockTime * 1000);

            this._highPriorityInterval = window.setInterval(() => {
                this._highPriorityUpdater();
            }, this._highPriorityFrequency);

            this._lowPriorityInterval = window.setInterval(() => {
                this._lowPriorityUpdater();
            }, this._lowPriorityFrequency);

            this._canvasClockInterval = window.setInterval(() => {
                this._canvasClockUpdater();
            }, this._canvasClockFrequency);

            this._isPlaying = true;

            if (!withoutUpdate) {
                this._synchronizeMedia();
            }

            const label: string = (this._data && this._data.content) ? this._data.content.pause : '';
            this._$playButton.prop('title', label);
            this._$playButton.find('i').switchClass('play', 'pause');

            this.fire(CanvasInstanceEvents.PLAYCANVAS);
            this.logMessage('PLAY canvas');
        }

        // todo: can this be part of the _data state?
        // this._data.play = false?
        public pause(withoutUpdate?: boolean): void {

            window.clearInterval(this._highPriorityInterval);
            window.clearInterval(this._lowPriorityInterval);
            window.clearInterval(this._canvasClockInterval);

            this._isPlaying = false;

            if (!withoutUpdate) {
                this._highPriorityUpdater();
                this._lowPriorityUpdater();
                this._synchronizeMedia();
            }

            const label: string = (this._data && this._data.content) ? this._data.content.play : '';
            this._$playButton.prop('title', label);
            this._$playButton.find('i').switchClass('pause', 'play');

            this.fire(CanvasInstanceEvents.PAUSECANVAS);
            this.logMessage('PAUSE canvas');
        }

        private _isNavigationConstrainedToRange(): boolean {
            return <boolean>this._data.constrainNavigationToRange;
        }

        private _canvasClockUpdater(): void {
            this._canvasClockTime = (Date.now() - this._canvasClockStartDate) / 1000;

            let duration: Duration | undefined;

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
        }

        private _highPriorityUpdater(): void {

            this._$rangeTimelineContainer.slider({
                value: this._canvasClockTime
            });

            this._$canvasTimelineContainer.slider({
                value: this._canvasClockTime
            });

            this._updateCurrentTimeDisplay();
            this._updateDurationDisplay();
        }

        private _lowPriorityUpdater(): void {
            this._updateMediaActiveStates();

            if (this._isPlaying && this._data.autoSelectRange && (this.isVirtual() || this.isOnlyCanvasInstance)) {
                this._hasRangeChanged();
            }

        }

        private _updateMediaActiveStates(): void {

            let contentAnnotation;

            for (let i = 0; i < this._contentAnnotations.length; i++) {

                contentAnnotation = this._contentAnnotations[i];

                if (contentAnnotation.start <= this._canvasClockTime && contentAnnotation.end >= this._canvasClockTime) {

                    this._checkMediaSynchronization();

                    if (!contentAnnotation.active) {
                        this._synchronizeMedia();
                        contentAnnotation.active = true;
                        contentAnnotation.element.show();
                        contentAnnotation.timelineElement.addClass('active');
                    }

                    if (contentAnnotation.element[0].currentTime > contentAnnotation.element[0].duration - contentAnnotation.endOffset) {
                        this._pauseMedia(contentAnnotation.element[0]);
                    }

                } else {

                    if (contentAnnotation.active) {
                        contentAnnotation.active = false;
                        contentAnnotation.element.hide();
                        contentAnnotation.timelineElement.removeClass('active');
                        this._pauseMedia(contentAnnotation.element[0]);
                    }

                }

            }

            //this.logMessage('UPDATE MEDIA ACTIVE STATES at: '+ this._canvasClockTime + ' seconds.');
        }

        private _pauseMedia(media: HTMLMediaElement): void {
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
        }

        private _setMediaCurrentTime(media: HTMLMediaElement, time: number): void {

            if (!isNaN(media.duration)) {
                media.currentTime = time;
            }
        }

        private _synchronizeMedia(): void {

            let contentAnnotation;

            for (let i = 0; i < this._contentAnnotations.length; i++) {

                contentAnnotation = this._contentAnnotations[i];

                this._setMediaCurrentTime(contentAnnotation.element[0], this._canvasClockTime - contentAnnotation.start + contentAnnotation.startOffset);

                if (contentAnnotation.start <= this._canvasClockTime && contentAnnotation.end >= this._canvasClockTime) {
                    if (this._isPlaying) {
                        if (contentAnnotation.element[0].paused) {
                            const promise = contentAnnotation.element[0].play();
                            if (promise) {
                                promise.catch(function () { });
                            }
                        }
                    } else {
                        this._pauseMedia(contentAnnotation.element[0]);
                    }
                } else {
                    this._pauseMedia(contentAnnotation.element[0]);
                }

                if (contentAnnotation.element[0].currentTime > contentAnnotation.element[0].duration - contentAnnotation.endOffset) {
                    this._pauseMedia(contentAnnotation.element[0]);
                }
            }

            this.logMessage('SYNC MEDIA at: ' + this._canvasClockTime + ' seconds.');

        }

        private _checkMediaSynchronization(): void {

            let contentAnnotation;

            for (let i = 0, l = this._contentAnnotations.length; i < l; i++) {

                contentAnnotation = this._contentAnnotations[i];

                if ((contentAnnotation.start <= this._canvasClockTime && contentAnnotation.end >= this._canvasClockTime)) {

                    const correctTime: number = (this._canvasClockTime - contentAnnotation.start + contentAnnotation.startOffset);
                    const factualTime: number = contentAnnotation.element[0].currentTime;

                    // off by 0.2 seconds
                    if (Math.abs(factualTime - correctTime) > this._mediaSyncMarginSecs) {

                        contentAnnotation.outOfSync = true;
                        //this.playbackStalled(true, contentAnnotation);

                        const lag: number = Math.abs(factualTime - correctTime);
                        this.logMessage('DETECTED synchronization lag: ' + Math.abs(lag));
                        this._setMediaCurrentTime(contentAnnotation.element[0], correctTime);
                        //this.synchronizeMedia();

                    } else {
                        contentAnnotation.outOfSync = false;
                        //this.playbackStalled(false, contentAnnotation);
                    }
                }
            }
        }

        private _playbackStalled(aBoolean: boolean, syncMediaRequestingStall: any): void {

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

            } else {

                const idx: number = this._stallRequestedBy.indexOf(syncMediaRequestingStall);

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
        }

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

        public resize(): void {
            if (this.$playerElement) {

                const containerWidth: number | undefined = this._$canvasContainer.width();

                if (containerWidth) {
                    this._$canvasTimelineContainer.width(containerWidth);

                    //const resizeFactorY: number = containerWidth / this.canvasWidth;
                    //$canvasContainer.height(this.canvasHeight * resizeFactorY);

                    const $options: JQuery = this.$playerElement.find('.options-container');

                    // if in the watch metric, make sure the canvasContainer isn't more than half the height to allow
                    // room between buttons
                    if (this._data.halveAtWidth !== undefined && <number>this.$playerElement.parent().width() < this._data.halveAtWidth) {
                        this._$canvasContainer.height(<number>this.$playerElement.parent().height() / 2);
                    } else {
                        this._$canvasContainer.height(<number>this.$playerElement.parent().height() - <number>$options.height());
                    }
                }

                if (this._waveformCanvas) {
                    const canvasWidth: number = <number>this._$canvasContainer.width();
                    const canvasHeight: number = <number>this._$canvasContainer.height();

                    this._waveformCanvas.width = canvasWidth;
                    this._waveformCanvas.height = canvasHeight;
                }

                this._render();
            }
        }

    }

    export class CanvasInstanceEvents {
        static NEXT_RANGE: string = 'nextrange';
        static PAUSECANVAS: string = 'pause';
        static PLAYCANVAS: string = 'play';
        static PREVIOUS_RANGE: string = 'previousrange';
    }

    export class CompositeWaveform {

        private _waveforms: Waveform[];
        public length: number = 0;
        public duration: number = 0;
        public pixelsPerSecond: number = Number.MAX_VALUE;
        public secondsPerPixel: number = Number.MAX_VALUE;

        constructor(waveforms: any[]) {
            this._waveforms = [];

            waveforms.forEach((waveform) => {
                this._waveforms.push({
                    start: this.length,
                    end: this.length + waveform.adapter.length,
                    waveform
                });

                this.length += waveform.adapter.length;
                this.duration += waveform.duration;
                this.pixelsPerSecond = Math.min(this.pixelsPerSecond, waveform.pixels_per_second);
                this.secondsPerPixel = Math.min(this.secondsPerPixel, waveform.seconds_per_pixel);
            });
        }

        // Note: these could be optimised, assuming access is sequential

        min(index: number) {
            const waveform = this._find(index);
            return waveform ? waveform.waveform.min_sample(index - waveform.start) : 0;
        }

        max(index: number) {
            const waveform = this._find(index);
            return waveform ? waveform.waveform.max_sample(index - waveform.start) : 0;
        }

        _find(index: number) {
            const waveforms = this._waveforms.filter((waveform) => {
                return index >= waveform.start && index < waveform.end;
            });

            return waveforms.length > 0 ? waveforms[0] : null;
        }
    }

    export class AVComponentUtils {

        private static _compare(a: any, b: any): string[] {
            const changed: string[] = [];
            Object.keys(a).forEach((p) => {
                if (!Object.is(b[p], a[p])) {
                    changed.push(p);
                }
            });
            return changed;
        }
        
        public static diff(a: any, b: any) {
            return Array.from(new Set(AVComponentUtils._compare(a, b).concat(AVComponentUtils._compare(b, a))));
        }

        public static getSpatialComponent(target: string): number[] | null {
            const spatial: RegExpExecArray | null = /xywh=([^&]+)/g.exec(target);
            let xywh: number[] | null = null;

            if (spatial && spatial[1]) {
                xywh = <any>spatial[1].split(',');
            }

            return xywh;
        }

        public static getFirstTargetedCanvasId(range: Range): string | undefined {
            
            let canvasId: string | undefined;

            if (range.canvases && range.canvases.length) {
                canvasId = range.canvases[0];
            } else {

                const childRanges: Range[] = range.getRanges();

                if (childRanges.length) {
                    return AVComponentUtils.getFirstTargetedCanvasId(childRanges[0]);
                }

            }

            if (canvasId !== undefined) {
                return Utils.normaliseUrl(canvasId);
            }

            return undefined;
        }

        public static getTimestamp(): string {
            return String(new Date().valueOf());
        }

        public static retargetTemporalComponent(canvases: Canvas[], target: string): string | undefined {
            
            let t: number[] | null = Utils.getTemporalComponent(target);

            if (t) {

                let offset: number = 0;
                let targetWithoutTemporal: string = target.substr(0, target.indexOf('#'));

                // loop through canvases adding up their durations until we reach the targeted canvas
                for (let i = 0; i < canvases.length; i++) {
                    const canvas: Canvas = canvases[i];
                    if (!canvas.id.includes(targetWithoutTemporal)) {
                        const duration: number | null = canvas.getDuration();
                        if (duration) {
                            offset += duration;
                        }
                    } else {
                        // we've reached the canvas whose target we're adjusting
                        break;
                    }
                }

                t[0] = Number(t[0]) + offset;
                t[1] = Number(t[1]) + offset;

                return targetWithoutTemporal + '#t=' + t[0] + ',' + t[1];
            }

            return undefined;
        }

        public static formatTime(aNumber: number): string {

            let hours: number | string, minutes: number | string, seconds: number | string, hourValue: string;

            seconds 	= Math.ceil(aNumber);
            hours 		= Math.floor(seconds / (60 * 60));
            hours 		= (hours >= 10) ? hours : '0' + hours;
            minutes 	= Math.floor(seconds % (60*60) / 60);
            minutes 	= (minutes >= 10) ? minutes : '0' + minutes;
            seconds 	= Math.floor(seconds % (60*60) % 60);
            seconds 	= (seconds >= 10) ? seconds : '0' + seconds;

            if (hours >= 1) {
                hourValue = hours + ':';
            } else {
                hourValue = '';
            }

            return hourValue + minutes + ':' + seconds;
        }

        public static isIE(): number | boolean {
            const ua = window.navigator.userAgent;

            // Test values; Uncomment to check result …

            // IE 10
            // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';
            
            // IE 11
            // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';
            
            // Edge 12 (Spartan)
            // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';
            
            // Edge 13
            // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';

            const msie = ua.indexOf('MSIE ');
            if (msie > 0) {
                // IE 10 or older => return version number
                return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
            }

            const trident = ua.indexOf('Trident/');
            if (trident > 0) {
                // IE 11 => return version number
                const rv = ua.indexOf('rv:');
                return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
            }

            const edge = ua.indexOf('Edge/');
            if (edge > 0) {
                // Edge (IE 12+) => return version number
                return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
            }

            // other browser
            return false;
        }

        public static isSafari() {
            // https://stackoverflow.com/questions/7944460/detect-safari-browser?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
            var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            console.log('isSafari', isSafari);
            return isSafari;
        }

        public static debounce(fn: any, debounceDuration: number): any {
            // summary:
            //      Returns a debounced function that will make sure the given
            //      function is not triggered too much.
            // fn: Function
            //      Function to debounce.
            // debounceDuration: Number
            //      OPTIONAL. The amount of time in milliseconds for which we
            //      will debounce the function. (defaults to 100ms)
            debounceDuration = debounceDuration || 100;

            return function() {
                if (!fn.debouncing) {
                    const args: any = Array.prototype.slice.apply(arguments);
                    fn.lastReturnVal = fn.apply(window, args);
                    fn.debouncing = true;
                }
                clearTimeout(fn.debounceTimeout);
                fn.debounceTimeout = setTimeout(function () {
                    fn.debouncing = false;
                }, debounceDuration);

                return fn.lastReturnVal;
            }
        }

        public static hlsMimeTypes = [
            // Apple santioned
            'application/vnd.apple.mpegurl',
            'vnd.apple.mpegurl',
            // Apple sanctioned for backwards compatibility
            'audio/mpegurl',
            // Very common
            'audio/x-mpegurl',
            // Very common
            'application/x-mpegurl',
            // Included for completeness
            'video/x-mpegurl',
            'video/mpegurl',
            'application/mpegurl'
        ];

        public static normalise(num: number, min: number, max: number): number {
            return (num - min) / (max - min);
        }
    
        public static isHLSFormat(format: MediaType) {
            return this.hlsMimeTypes.includes(format.toString());
        }
    
        public static isMpegDashFormat(format: MediaType) {
            return format.toString() === 'application/dash+xml';
        }

        public static canPlayHls() {
            var doc = typeof document === 'object' && document,
            videoelem = doc && doc.createElement('video'),
            isvideosupport = Boolean(videoelem && videoelem.canPlayType);

            return isvideosupport && this.hlsMimeTypes.some(function (canItPlay) {
                return /maybe|probably/i.test((<any>videoelem).canPlayType(canItPlay));
            });
        }

    }

    export class VirtualCanvas {
        
        public canvases: Canvas[] = [];
        public id: string;

        constructor() {
            // generate an id
            this.id = AVComponentUtils.getTimestamp();
        }

        public addCanvas(canvas: Canvas): void {
            // canvases need to be deep copied including functions
            this.canvases.push(jQuery.extend(true, {}, canvas));
        }

        public getContent(): Annotation[] {

            const annotations: Annotation[] = [];

            this.canvases.forEach((canvas: Canvas) => {
                const items: Annotation[] = canvas.getContent();

                // if the annotations have no temporal target, add one so that
                // they specifically target the duration of their canvas
                items.forEach((item: Annotation) => {
                    const target: string | null = item.getTarget();

                    if (target) {
                        let t: number[] | null = Utils.getTemporalComponent(target);
                        if (!t) {
                            item.__jsonld.target += '#t=0,' + canvas.getDuration();
                        }
                    }
                    
                });

                items.forEach((item: Annotation) => {
                    const target: string | null = item.getTarget();

                    if (target) {
                        item.__jsonld.target = AVComponentUtils.retargetTemporalComponent(this.canvases, target);                        
                    }
                });

                annotations.push(...items);
            });

            return annotations;
        }

        getDuration(): number | null {

            let duration: number = 0;

            this.canvases.forEach((canvas: Canvas) => {
                const d: number | null = canvas.getDuration();
                if (d) {
                    duration += d;
                }
            });
            
            return duration;
        }

        getWidth(): number {
            if (this.canvases.length) {
                return this.canvases[0].getWidth();
            }
            return 0;
        }

        getHeight(): number {
            if (this.canvases.length) {
                return this.canvases[0].getHeight();
            }
            return 0;
        }
    }

    export class Waveform {
        public start: number;
        public end: number;
        public waveform: any;
    }

    export class AVComponent extends _Components.BaseComponent {

        private _data: IAVComponentData = this.data();
        public options: _Components.IBaseComponentOptions;
        public canvasInstances: CanvasInstance[] = [];
        private _checkAllMediaReadyInterval: any;
        private _checkAllWaveformsReadyInterval: any;
        private _readyMedia: number = 0;
        private _readyWaveforms: number = 0;
        private _posterCanvasWidth: number = 0;
        private _posterCanvasHeight: number = 0;

        private _$posterContainer: JQuery;
        private _$posterImage: JQuery;
        private _$posterExpandButton: JQuery;

        private _posterImageExpanded: boolean = false;

        constructor(options: _Components.IBaseComponentOptions) {
            super(options);

            this._init();
            this._resize();
        }

        protected _init(): boolean {
            const success: boolean = super._init();

            if (!success) {
                console.error("Component failed to initialise");
            }

            return success;
        }

        public data(): IAVComponentData {
            return <IAVComponentData> {
                autoPlay: false,
                constrainNavigationToRange: false,
                defaultAspectRatio: 0.56,
                doubleClickMS: 350,
                halveAtWidth: 200,
                limitToRange: false,
                posterImageRatio: 0.3,
                virtualCanvasEnabled: true,
                content: <IAVComponentContent>{
                    currentTime: "Current Time",
                    collapse: "Collapse",
                    duration: "Duration",
                    expand: "Expand",
                    mute: "Mute",
                    next: "Next",
                    pause: "Pause",
                    play: "Play",
                    previous: "Previous",
                    unmute: "Unmute"
                }
            }
        }

        public set(data: IAVComponentData): void {

            const oldData: IAVComponentData = Object.assign({}, this._data);
            this._data = Object.assign(this._data, data);
            const diff: string[] = AVComponentUtils.diff(oldData, this._data);

            // changing any of these data properties forces a reload.
            if (diff.includes('helper')) {
                // create canvases
                this._reset();
            }

            if (!this._data.helper) {
                console.warn('must pass a helper object');
                return;
            }

            if (diff.includes('limitToRange') && this._data.canvasId) {

                this.canvasInstances.forEach((canvasInstance: CanvasInstance, index: number) => {
                    canvasInstance.set({ 
                        limitToRange: this._data.limitToRange
                    });
                });
            }

            if (diff.includes('constrainNavigationToRange') && this._data.canvasId) {

                this.canvasInstances.forEach((canvasInstance: CanvasInstance, index: number) => {
                    canvasInstance.set({ 
                        constrainNavigationToRange: this._data.constrainNavigationToRange
                    });
                });
            }

            if (diff.includes('autoSelectRange') && this._data.canvasId) {

                this.canvasInstances.forEach((canvasInstance: CanvasInstance, index: number) => {
                    canvasInstance.set({ 
                        autoSelectRange: this._data.autoSelectRange
                    });
                });
            }

            if (diff.includes('canvasId') && this._data.canvasId) {

                const nextCanvasInstance: CanvasInstance | undefined = this._getCanvasInstanceById(this._data.canvasId);

                if (nextCanvasInstance) {
                    
                    this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
                        // hide canvases that don't have the same id        
                        if (canvasInstance.getCanvasId() !== nextCanvasInstance.getCanvasId()) {
                            canvasInstance.set({ 
                                visible: false
                            });
                        } else {

                            if (diff.includes('range')) {
                                canvasInstance.set({ 
                                    visible: true,
                                    range: this._data.range ? jQuery.extend(true, {}, this._data.range) : undefined
                                });
                            } else {
                                canvasInstance.set({ 
                                    visible: true
                                });
                            }
                            
                        }
                    });

                }
                
            }

            if (diff.includes('virtualCanvasEnabled')) {

                this.set({
                    range: undefined
                });

                // as you don't know the id of virtual canvases, you can toggle them on
                // but when toggling off, you must call showCanvas to show the next canvas
                if (this._data.virtualCanvasEnabled) {

                    this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {   
                        if (canvasInstance.isVirtual()) {
                            this.set({
                                canvasId: canvasInstance.getCanvasId(),
                                range: undefined
                            });
                        }
                    });

                }            

            }
            
            if (diff.includes('range') && this._data.range) {

                let range: Range | null = this._data.helper.getRangeById(this._data.range.id);

                if (!range) {
                    console.warn('range not found');
                } else {

                    let canvasId: string | undefined = AVComponentUtils.getFirstTargetedCanvasId(range);

                    if (canvasId) {

                        // get canvas by normalised id (without temporal part)
                        const canvasInstance: CanvasInstance | undefined = this._getCanvasInstanceById(canvasId);
                        
                        if (canvasInstance) {
                            
                            if (canvasInstance.isVirtual() && this._data.virtualCanvasEnabled) {                                
                                if (canvasInstance.includesVirtualSubCanvas(canvasId)) {
                                    canvasId = canvasInstance.getCanvasId();

                                    // use the retargeted range
                                    for (let i = 0; i < canvasInstance.ranges.length; i++) {
                                        const r: Range = canvasInstance.ranges[i];

                                        if (r.id === range.id) {
                                            range = r;
                                            break;
                                        }
                                    }
                                }
                            }

                            // if not using the correct canvasinstance, switch to it                    
                            if (this._data.canvasId && 
                                ((this._data.canvasId.includes('://')) ? Utils.normaliseUrl(this._data.canvasId) : this._data.canvasId) !== canvasId) {

                                this.set({
                                    canvasId: canvasId,
                                    range: jQuery.extend(true, {}, range) // force diff
                                });

                            } else {

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
        }

        private _render(): void {

            
        }

        public reset(): void {
            this._reset();
        }

        private _reset(): void {

            this._readyMedia = 0;
            this._readyWaveforms = 0;
            this._posterCanvasWidth = 0;
            this._posterCanvasHeight = 0;

            clearInterval(this._checkAllMediaReadyInterval);
            clearInterval(this._checkAllWaveformsReadyInterval);

            this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
                canvasInstance.destroy();
            });

            this.canvasInstances = [];

            this._$element.empty();

            if (this._data && this._data.helper) {

                // if the manifest has an auto-advance behavior, join the canvases into a single "virtual" canvas
                const behavior: Behavior | null = this._data.helper.manifest.getBehavior();
                const canvases: Canvas[] = this._getCanvases();

                if (behavior && behavior.toString() === Behavior.autoadvance().toString()) {

                    const virtualCanvas: VirtualCanvas = new VirtualCanvas();

                    canvases.forEach((canvas: Canvas) => {
                        virtualCanvas.addCanvas(canvas);
                    });

                    this._initCanvas(virtualCanvas);

                }                

                // all canvases need to be individually navigable
                canvases.forEach((canvas: Canvas) => {
                    this._initCanvas(canvas);
                });                

                if (this.canvasInstances.length > 0) {
                    this._data.canvasId = <string>this.canvasInstances[0].getCanvasId()
                }

                this._checkAllMediaReadyInterval = setInterval(this._checkAllMediaReady.bind(this), 100);
                this._checkAllWaveformsReadyInterval = setInterval(this._checkAllWaveformsReady.bind(this), 100);

                this._$posterContainer = $('<div class="poster-container"></div>');
                this._$element.append(this._$posterContainer);

                this._$posterImage = $('<div class="poster-image"></div>');
                this._$posterExpandButton = $(`
                    <button class="btn" title="${this._data && this._data.content ? this._data.content.expand : ''}">
                        <i class="av-icon  av-icon-expand expand" aria-hidden="true"></i><span>${this._data && this._data.content ? this._data.content.expand : ''}</span>
                    </button>
                `);
                this._$posterImage.append(this._$posterExpandButton);

                this._$posterImage.on('touchstart click', (e) => {    
                    
                    e.preventDefault();
                    
                    const target: any = this._getPosterImageCss(!this._posterImageExpanded);
                    //this._$posterImage.animate(target,"fast", "easein");
                    this._$posterImage.animate(target);
                    this._posterImageExpanded = !this._posterImageExpanded;

                    if (this._data.content) {
                        if (this._posterImageExpanded) {
                            const label: string = this._data.content.collapse;
                            this._$posterExpandButton.prop('title', label);
                            this._$posterExpandButton.find('i').switchClass('expand', 'collapse');
                        } else {
                            const label: string = this._data.content.expand;
                            this._$posterExpandButton.prop('title', label);
                            this._$posterExpandButton.find('i').switchClass('collapse', 'expand');
                        }
                    }
                    
                });

                // poster canvas
                const posterCanvas: Canvas | null = this._data.helper.getPosterCanvas();

                if (posterCanvas) {

                    this._posterCanvasWidth = posterCanvas.getWidth();
                    this._posterCanvasHeight = posterCanvas.getHeight();

                    const posterImage: string | null = this._data.helper.getPosterImage();

                    if (posterImage) {
                        this._$posterContainer.append(this._$posterImage);

                        let css: any = this._getPosterImageCss(this._posterImageExpanded);
                        css = Object.assign({}, css, {
                            'background-image': 'url(' + posterImage + ')'
                        });

                        this._$posterImage.css(css);
                    }
                }

            }

        }

        private _checkAllMediaReady(): void {
            console.log('loading media');
            if (this._readyMedia === this.canvasInstances.length) {
                console.log('all media ready');
                clearInterval(this._checkAllMediaReadyInterval);
                //that._logMessage('CREATED CANVAS: ' + canvasInstance.canvasClockDuration + ' seconds, ' + canvasInstance.canvasWidth + ' x ' + canvasInstance.canvasHeight + ' px.');
                this.fire(AVComponent.Events.MEDIA_READY);
                this.resize();
            }
        }

        private _checkAllWaveformsReady(): void {
            console.log('loading waveforms');
            if (this._readyWaveforms === this._getCanvasInstancesWithWaveforms().length) {
                console.log('waveforms ready');
                clearInterval(this._checkAllWaveformsReadyInterval);
                this.fire(AVComponent.Events.WAVEFORMS_READY);
                this.resize();
            }
        }

        private _getCanvasInstancesWithWaveforms(): CanvasInstance[] {
            return this.canvasInstances.filter((c) => {
                return c.waveforms.length > 0;
            });
        }

        private _getCanvases(): Canvas[] {
            if (this._data.helper) {
                return this._data.helper.getCanvases();
            }
            
            return [];
        }

        private _initCanvas(canvas: Canvas | VirtualCanvas): void {

            const canvasInstance: CanvasInstance = new CanvasInstance({
                target: document.createElement('div'),
                data: Object.assign({}, { canvas: canvas }, this._data)
            });

            canvasInstance.logMessage = this._logMessage.bind(this);
            canvasInstance.isOnlyCanvasInstance = this._getCanvases().length === 1;
            this._$element.append(canvasInstance.$playerElement);

            canvasInstance.init();
            this.canvasInstances.push(canvasInstance);      

            canvasInstance.on(AVComponent.Events.MEDIA_READY, () => {
                this._readyMedia++;
            }, false);

            canvasInstance.on(AVComponent.Events.WAVEFORM_READY, () => {
                this._readyWaveforms++;
            }, false);

            // canvasInstance.on(AVComponent.Events.RESETCANVAS, () => {
            //     this.playCanvas(canvasInstance.canvas.id);
            // }, false);

            canvasInstance.on(CanvasInstanceEvents.PREVIOUS_RANGE, () => {
                this._prevRange();
            }, false);

            canvasInstance.on(CanvasInstanceEvents.NEXT_RANGE, () => {
                this._nextRange();
            }, false);

            canvasInstance.on(AVComponent.Events.RANGE_CHANGED, (rangeId: string | null) => {
                this.fire(AVComponent.Events.RANGE_CHANGED, rangeId);
            }, false);

            canvasInstance.on(VolumeEvents.VOLUME_CHANGED, (volume: number) => {
                this._setCanvasInstanceVolumes(volume);
                this.fire(VolumeEvents.VOLUME_CHANGED, volume);
            }, false);
        }

        private _prevRange(): void {
            if (!this._data || !this._data.helper) {
                return;
            }

            const prevRange: Range | null = this._data.helper.getPreviousRange();

            if (prevRange) {
                this.playRange(prevRange.id);
            } else {
                // no previous range. rewind.
                this._rewind();
            }
        }

        private _nextRange(): void {
            if (!this._data || !this._data.helper) {
                return;
            }

            const nextRange: Range | null = this._data.helper.getNextRange();

            if (nextRange) {
                this.playRange(nextRange.id);         
            }
        }

        private _setCanvasInstanceVolumes(volume: number): void {

            this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
                canvasInstance.set({
                    volume: volume
                });
            });
        }

        private _getNormaliseCanvasId(canvasId: string): string {
            return (canvasId.includes('://')) ? Utils.normaliseUrl(canvasId) : canvasId;
        }

        private _getCanvasInstanceById(canvasId: string): CanvasInstance | undefined {
            
            canvasId = this._getNormaliseCanvasId(canvasId);
    
            // if virtual canvas is enabled, check for that first
            if (this._data.virtualCanvasEnabled) {

                for (let i = 0; i < this.canvasInstances.length; i++) {
    
                    const canvasInstance: IIIFComponents.CanvasInstance = this.canvasInstances[i];
                    
                    let currentCanvasId: string | undefined = canvasInstance.getCanvasId();

                    if (currentCanvasId) {

                        currentCanvasId = this._getNormaliseCanvasId(currentCanvasId);

                        if ((canvasInstance.isVirtual() || this.canvasInstances.length === 1) && currentCanvasId === canvasId || 
                            canvasInstance.includesVirtualSubCanvas(canvasId)) {
                            return canvasInstance;
                        }

                    }

                }

            } else {

                for (let i = 0; i < this.canvasInstances.length; i++) {

                    const canvasInstance: IIIFComponents.CanvasInstance = this.canvasInstances[i];
                    const id: string | undefined = canvasInstance.getCanvasId();

                    if (id) {
                        const canvasInstanceId: string = Utils.normaliseUrl(id);

                        if (canvasInstanceId === canvasId) {
                            return canvasInstance;
                        }
                    }
                }
            }

            return undefined;
        }

        private _getCurrentCanvas(): CanvasInstance | undefined {
            if (this._data.canvasId) {
                return this._getCanvasInstanceById(this._data.canvasId);
            }

            return undefined;
        }
        
        private _rewind(): void {

            if (this._data.limitToRange) {
                return;
            }
            
            const canvasInstance: CanvasInstance | undefined = this._getCurrentCanvas();

            if (canvasInstance) {
                canvasInstance.set({
                    range: undefined
                });             
            }
        }

        public play(): void {
            const currentCanvas: CanvasInstance | undefined = this._getCurrentCanvas();

            if (currentCanvas) {
                currentCanvas.play();
            }
        }

        public pause(): void {
            const currentCanvas: CanvasInstance | undefined = this._getCurrentCanvas();

            if (currentCanvas) {
                currentCanvas.pause();
            }
        }

        public playRange(rangeId: string): void {

            if (!this._data.helper) {
                return;
            }

            const range: Range | null = this._data.helper.getRangeById(rangeId);

            if (range) {
                this.set({
                    range: jQuery.extend(true, {}, range)
                });
            }
        }

        public showCanvas(canvasId: string): void {
            
            // if the passed canvas id is already the current canvas id, but the canvas isn't visible
            // (switching from virtual canvas)

            const currentCanvas: CanvasInstance | undefined = this._getCurrentCanvas();

            if (currentCanvas && currentCanvas.getCanvasId() === canvasId && !currentCanvas.isVisible()) {
                currentCanvas.set({
                    visible: true
                });
            } else {
                this.set({
                    canvasId: canvasId
                });
            }

        }

        private _logMessage(message: string): void {
            this.fire(AVComponent.Events.LOG, message);
        }

        private _getPosterImageCss(expanded: boolean): any {
            
            const currentCanvas: CanvasInstance | undefined = this._getCurrentCanvas();

            if (currentCanvas) {

                const $options: JQuery = currentCanvas.$playerElement.find('.options-container');
                const containerWidth: number = <number>currentCanvas.$playerElement.parent().width();
                const containerHeight: number = <number>currentCanvas.$playerElement.parent().height() - <number>$options.height();

                if (expanded) {
                    return {
                        'top': 0,
                        'left': 0,
                        'width': containerWidth,
                        'height': containerHeight
                    }
                } else {

                    // get the longer edge of the poster canvas and make that a ratio of the container height/width.
                    // scale the shorter edge proportionally.
                    let ratio: number;
                    let width: number;
                    let height: number;

                    if (this._posterCanvasWidth > this._posterCanvasHeight) {
                        ratio = this._posterCanvasHeight / this._posterCanvasWidth;
                        width = containerWidth * <number>this._data.posterImageRatio;
                        height = width * ratio;
                    } else { // either height is greater, or width and height are equal
                        ratio = this._posterCanvasWidth / this._posterCanvasHeight;
                        height = containerHeight * <number>this._data.posterImageRatio;
                        width = height * ratio;
                    }

                    return {
                        'top': 0,
                        'left': containerWidth - width,
                        'width': width,
                        'height': height
                    }
                }
            }

            return null;
        }

        public resize(): void {
            this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
                canvasInstance.resize();
            });

            // get the visible player and align the poster to it
            const currentCanvas: CanvasInstance | undefined = this._getCurrentCanvas();

            if (currentCanvas) {
                if (this._$posterImage && this._$posterImage.is(':visible')) {
                    if (this._posterImageExpanded) {
                        this._$posterImage.css(this._getPosterImageCss(true));
                    } else {
                        this._$posterImage.css(this._getPosterImageCss(false));
                    }

                    // this._$posterExpandButton.css({
                    //     top: <number>this._$posterImage.height() - <number>this._$posterExpandButton.outerHeight()
                    // });
                }
            }
        }
    }
}

namespace IIIFComponents.AVComponent {
    export class Events {
        static MEDIA_READY: string = 'mediaready';
        static LOG: string = 'log';
        static RANGE_CHANGED: string = 'rangechanged';
        static WAVEFORM_READY: string = 'waveformready';
        static WAVEFORMS_READY: string = 'waveformsready';
    }
}

(function(g:any) {
    if (!g.IIIFComponents) {
        g.IIIFComponents = IIIFComponents;
    } else {
        g.IIIFComponents.AVComponent = IIIFComponents.AVComponent;
    }
})(window);