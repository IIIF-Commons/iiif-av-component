namespace IIIFComponents {

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
        private _canvasClockDuration: number = 0; // todo: should these 0 values be undefined by default?
        private _canvasClockFrequency: number = 25;
        private _canvasClockInterval: number;
        private _canvasClockStartDate: number = 0;
        private _canvasClockTime: number = 0;
        private _canvasHeight: number = 0;
        private _canvasWidth: number = 0;
        private _contentAnnotations: any[]; // todo: type as HTMLMediaElement?
        private _data: IAVCanvasInstanceData = this.data();
        private _highPriorityFrequency: number = 25;
        private _highPriorityInterval: number;
        private _isPlaying: boolean = false;
        private _isStalled: boolean = false;
        private _lowPriorityFrequency: number = 250;
        private _lowPriorityInterval: number;
        private _ranges: AVComponentObjects.CanvasRange[] = [];
        private _readyCanvasesCount: number = 0;
        private _stallRequestedBy: any[] = []; //todo: type
        private _volume: AVVolumeControl;
        private _wasPlaying: boolean = false;

        public $playerElement: JQuery;
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
                                    <i class="av-icon-previous" aria-hidden="true"></i>${this._data.content.previous}
                                </button>`);
            this._$playButton = $(`
                                <button class="btn" title="${this._data.content.play}">
                                    <i class="av-icon-play play" aria-hidden="true"></i>${this._data.content.play}
                                </button>`);
            this._$nextButton = $(`
                                <button class="btn" title="${this._data.content.next}">
                                    <i class="av-icon-next" aria-hidden="true"></i>${this._data.content.next}
                                </button>`);
            this._$timeDisplay = $('<div class="time-display"><span class="canvas-time"></span> / <span class="canvas-duration"></span></div>');
            this._$canvasTime = this._$timeDisplay.find('.canvas-time');
            this._$canvasDuration = this._$timeDisplay.find('.canvas-duration');

            const $volume: JQuery = $('<div class="volume"></div>');
            this._volume = new AVVolumeControl({
                target: $volume[0],
                data: Object.assign({}, this._data)
            });

            this._volume.on(AVVolumeControl.Events.VOLUME_CHANGED, (value: number) => {
                this.fire(AVVolumeControl.Events.VOLUME_CHANGED, value);
            }, false);

            this._$controlsContainer.append(this._$prevButton, this._$playButton, this._$nextButton, this._$timeDisplay, $volume);
            this._$canvasTimelineContainer.append(this._$canvasHoverPreview, this._$canvasHoverHighlight, this._$durationHighlight);
            this._$rangeTimelineContainer.append(this._$rangeHoverPreview, this._$rangeHoverHighlight);
            this._$optionsContainer.append(this._$canvasTimelineContainer, this._$rangeTimelineContainer, this._$timelineItemContainer, this._$controlsContainer);
            this.$playerElement.append(this._$canvasContainer, this._$optionsContainer);

            this._$canvasHoverPreview.hide();
            this._$rangeHoverPreview.hide();

            if (this._data.helper && this._data.canvas) {
                const ranges: Manifesto.IRange[] = this._data.helper.getCanvasRanges(this._data.canvas);

                ranges.forEach((range: Manifesto.IRange) => {
                    this._ranges.push(new AVComponentObjects.CanvasRange(range));
                });
            }

            this._canvasClockDuration = <number>this._data.canvas.getDuration();

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

            this._$prevButton.on('click', () => {

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

            this._$playButton.on('click', () => {
                if (this._isPlaying) {
                    this._pause();
                } else {
                    this._play();
                }
            });

            this._$nextButton.on('click', () => {
                this._next();
            });

            this._$canvasTimelineContainer.slider({
                value: 0,
                step: 0.01,
                orientation: "horizontal",
                range: "min",
                max: that._canvasClockDuration,
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
                this._updateHoverPreview(e, this._$canvasTimelineContainer, this._canvasClockDuration);
            });

            this._$rangeTimelineContainer.on("mousemove", (e) => {
                if (this._data.range) {
                    this._updateHoverPreview(e, this._$rangeTimelineContainer, this._data.range.duration ? this._data.range.duration.getLength() : 0);
                }
            });

            // create annotations

            this._contentAnnotations = [];

            const items: Manifesto.IAnnotation[] = this._data.canvas.getContent();// (<any>this._data.canvas).__jsonld.content[0].items;

            if (items.length === 1) {
                this._$timelineItemContainer.hide();
            }

            for (let i = 0; i < items.length; i++) {

                const item: Manifesto.IAnnotation = items[i];

                /*
                if (item.motivation != 'painting') {
                    return null;
                }
                */

                let mediaSource: any;
                const bodies: Manifesto.IAnnotationBody[] = item.getBody();

                if (!bodies.length) {
                    console.warn('item has no body');
                    return;
                }

                const body: Manifesto.IAnnotationBody = bodies[0];
                const type: Manifesto.ResourceType | null = body.getType();
                const format: Manifesto.MediaType | null = body.getFormat();

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

                const spatial: RegExpExecArray | null = /xywh=([^&]+)/g.exec(target);
                const temporal: RegExpExecArray | null = /t=([^&]+)/g.exec(target);

                let xywh;

                if (spatial && spatial[1]) {
                    xywh = spatial[1].split(',');
                } else {
                    xywh = [0, 0, this._canvasWidth, this._canvasHeight];
                }

                let t;

                if (temporal && temporal[1]) {
                    t = temporal[1].split(',');
                } else {
                    t = [0, this._canvasClockDuration];
                }

                const positionLeft = parseInt(<string>xywh[0]),
                    positionTop = parseInt(<string>xywh[1]),
                    mediaWidth = parseInt(<string>xywh[2]),
                    mediaHeight = parseInt(<string>xywh[3]),
                    startTime = parseInt(<string>t[0]),
                    endTime = parseInt(<string>t[1]);

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
                    'type': type,
                    'source': mediaSource,
                    'start': startTime,
                    'end': endTime,
                    'top': percentageTop,
                    'left': percentageLeft,
                    'width': percentageWidth,
                    'height': percentageHeight,
                    'startOffset': offsetStart,
                    'endOffset': offsetEnd,
                    'active': false,
                    'format': format
                }

                this._renderMediaElement(itemData);
            }
        }

        public set(data: IAVCanvasInstanceData): void {

            const oldData: IAVCanvasInstanceData = Object.assign({}, this._data);
            this._data = Object.assign(this._data, data);
            const diff: string[] = AVComponentUtils.Utils.diff(oldData, this._data);

            if (diff.includes('visible')) {

                if (this._data.canvas) {
                    if (this._data.visible) {
                        this.$playerElement.show();
                        //console.log('show ' + this._data.canvas.id);
                    } else {
                        this.$playerElement.hide();
                        this._pause();
                        //console.log('hide ' + this._data.canvas.id);
                    }

                    this.resize();
                }
            }

            if (diff.includes('range')) {

                if (this._data.helper) {

                    if (!this._data.range) {
                        this.fire(AVComponent.Events.RANGE_CHANGED, null);
                    } else if (this._data.range.duration) {

                        // if the range has changed, update the time if not already within the duration span
                        if (!this._data.range.spans(this._canvasClockTime)) {
                            this._setCurrentTime(this._data.range.duration.start);
                        }

                        this._play();

                        this.fire(AVComponent.Events.RANGE_CHANGED, this._data.range.rangeId);
                    }
                }

            }

            this._render();
        }

        private _render(): void {

            if (this._data.range && this._data.range.duration) {

                // get the total length in seconds.
                const totalLength: number = this._canvasClockDuration;

                // get the length of the timeline container
                const timelineLength: number = <number>this._$canvasTimelineContainer.width();

                // get the ratio of seconds to length
                const ratio: number = timelineLength / totalLength;
                const start: number = this._data.range.duration.start * ratio;
                const end: number = this._data.range.duration.end * ratio;
                const width: number = end - start;

                this._$durationHighlight.show();

                // set the start position and width
                this._$durationHighlight.css({
                    left: start,
                    width: width
                });

                const that = this;

                this._$rangeTimelineContainer.slider("destroy");

                this._$rangeTimelineContainer.slider({
                    value: this._data.range.duration.start,
                    step: 0.01,
                    orientation: "horizontal",
                    range: "min",
                    min: this._data.range.duration.start,
                    max: this._data.range.duration.end,
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

            } else {
                this._$durationHighlight.hide();
            }

            this._contentAnnotations.forEach(($mediaElement: any) => {
                $($mediaElement.element).prop("volume", this._data.volume);

                this._volume.set({
                    volume: this._data.volume
                });
            });

            if (this._data.limitToRange && this._data.range) {
                this._$canvasTimelineContainer.hide();
                this._$rangeTimelineContainer.show();
            } else {
                this._$canvasTimelineContainer.show();
                this._$rangeTimelineContainer.hide();
            }

            this._updateCurrentTimeDisplay();
            this._updateDurationDisplay();
        }

        public getCanvasId(): string | null {
            if (this._data && this._data.canvas) {
                return this._data.canvas.id;
            }

            return null;
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
            $hoverPreview.find('.label').text(AVComponentUtils.Utils.formatTime(seconds));
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
                        this.fire(AVComponentCanvasInstance.Events.PREVIOUS_RANGE);
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
                        this.fire(AVComponentCanvasInstance.Events.PREVIOUS_RANGE);
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
                    this.fire(AVComponentCanvasInstance.Events.NEXT_RANGE);
                }
            } else {
                this.fire(AVComponentCanvasInstance.Events.NEXT_RANGE);
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
                case 'image':
                    $mediaElement = $('<img class="anno" src="' + data.source + '" />');
                    break;
                case 'video':
                    $mediaElement = $('<video class="anno" />');
                    break;
                case 'audio':
                    $mediaElement = $('<audio class="anno" />');
                    break;
                case 'textualbody':
                    $mediaElement = $('<div class="anno">' + data.source + '</div>');
                    break;
                default:
                    return;
            }

            const video: HTMLMediaElement = $mediaElement[0] as HTMLMediaElement;

            if (data.format && data.format.toString() === 'application/dash+xml') {
                // dash
                $mediaElement.attr('data-dashjs-player', '');
                const player = dashjs.MediaPlayer().create();
                player.initialize(video, data.source);
            } else if (data.format && data.format.toString() === 'application/vnd.apple.mpegurl') {
                // hls
                if (Hls.isSupported()) {
                    var hls = new Hls();
                    hls.loadSource(data.source);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, function () {
                        video.play();
                    });
                }
                // hls.js is not supported on platforms that do not have Media Source Extensions (MSE) enabled.
                // When the browser has built-in HLS support (check using `canPlayType`), we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video element throught the `src` property.
                // This is using the built-in support of the plain video element, without using hls.js.
                else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = data.source;
                    video.addEventListener('canplay', function () {
                        video.play();
                    });
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

            if (type === 'video' || type === 'audio') {

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
            }

            this._contentAnnotations.push(data);

            if (this.$playerElement) {
                this._$canvasContainer.append($mediaElement);
            }

            if (type === 'video' || type === 'audio') {

                $mediaElement.on('loadstart', () => {
                    //console.log('loadstart');
                    data.checkForStall();
                });

                $mediaElement.on('waiting', () => {
                    //console.log('waiting');
                    data.checkForStall();
                });

                $mediaElement.on('seeking', () => {
                    //console.log('seeking');
                    //data.checkForStall();
                });

                $mediaElement.on('loadedmetadata', () => {
                    this._readyCanvasesCount++;

                    if (this._readyCanvasesCount === this._contentAnnotations.length) {

                        //if (!this._data.range) {
                        this._setCurrentTime(0);
                        //}                        

                        if (this.options.data.autoPlay) {
                            this._play();
                        }

                        this._updateDurationDisplay();

                        this.fire(AVComponent.Events.CANVASREADY);
                    }
                });

                $mediaElement.attr('preload', 'auto');

                (<any>$mediaElement.get(0)).load(); // todo: type
            }

            this._renderSyncIndicator(data);
        }

        private _hasRangeChanged(): void {

            const range: AVComponentObjects.CanvasRange | undefined = this._getRangeForCurrentTime();

            if (range !== this._data.range && !this._data.limitToRange) {
                this.set({
                    range: range
                });
            }
        }

        private _getRangeForCurrentTime(): AVComponentObjects.CanvasRange | undefined {

            for (let i = 0; i < this._ranges.length; i++) {

                const range: AVComponentObjects.CanvasRange = this._ranges[i];

                if (!range.nonav && range.spans(this._canvasClockTime)) {
                    return range;
                }
            }

            return undefined;
        }

        private _updateCurrentTimeDisplay(): void {
            if (this._data.limitToRange && this._data.range && this._data.range.duration) {
                const rangeClockTime: number = this._canvasClockTime - this._data.range.duration.start;
                this._$canvasTime.text(AVComponentUtils.Utils.formatTime(rangeClockTime));
            } else {
                this._$canvasTime.text(AVComponentUtils.Utils.formatTime(this._canvasClockTime));
            }
        }

        private _updateDurationDisplay(): void {
            if (this._data.limitToRange && this._data.range && this._data.range.duration) {
                this._$canvasDuration.text(AVComponentUtils.Utils.formatTime(this._data.range.duration.getLength()));
            } else {
                this._$canvasDuration.text(AVComponentUtils.Utils.formatTime(this._canvasClockDuration));
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

            const leftPercent: number = this._convertToPercentage(mediaElementData.start, this._canvasClockDuration);
            const widthPercent: number = this._convertToPercentage(mediaElementData.end - mediaElementData.start, this._canvasClockDuration);

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

        // todo: can this be part of the _data state?
        // this._data.rewind = true?
        private _rewind(withoutUpdate?: boolean): void {

            this._pause();

            if (this._data.limitToRange && this._data.range && this._data.range.duration) {
                this._canvasClockTime = this._data.range.duration.start;
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

            this._play();
        }

        // todo: can this be part of the _data state?
        // this._data.fastforward = true?
        private _fastforward(): void {

            if (this._data.limitToRange && this._data.range && this._data.range.duration) {
                this._canvasClockTime = this._data.range.duration.end;
            } else {
                this._canvasClockTime = this._canvasClockDuration;
            }

            this._pause();
        }

        // todo: can this be part of the _data state?
        // this._data.play = true?
        private _play(withoutUpdate?: boolean): void {
            if (this._isPlaying) return;

            if (this._data.limitToRange && this._data.range && this._data.range.duration && this._canvasClockTime >= this._data.range.duration.end) {
                this._canvasClockTime = this._data.range.duration.start;
            }

            if (this._canvasClockTime === this._canvasClockDuration) {
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

            this._$playButton.find('i').switchClass('play', 'pause');

            this.fire(AVComponentCanvasInstance.Events.PLAYCANVAS);
            this.logMessage('PLAY canvas');
        }

        // todo: can this be part of the _data state?
        // this._data.play = false?
        private _pause(withoutUpdate?: boolean): void {

            window.clearInterval(this._highPriorityInterval);
            window.clearInterval(this._lowPriorityInterval);
            window.clearInterval(this._canvasClockInterval);

            this._isPlaying = false;

            if (!withoutUpdate) {
                this._highPriorityUpdater();
                this._lowPriorityUpdater();
                this._synchronizeMedia();
            }

            this._$playButton.find('i').switchClass('pause', 'play');

            this.fire(AVComponentCanvasInstance.Events.PAUSECANVAS);
            this.logMessage('PAUSE canvas');
        }

        private _isNavigationConstrainedToRange(): boolean {
            return <boolean>this._data.constrainNavigationToRange;
        }

        private _canvasClockUpdater(): void {
            this._canvasClockTime = (Date.now() - this._canvasClockStartDate) / 1000;

            if (this._data.limitToRange && this._data.range && this._data.range.duration && this._canvasClockTime >= this._data.range.duration.end) {
                this._pause();
            }

            if (this._canvasClockTime >= this._canvasClockDuration) {
                this._canvasClockTime = this._canvasClockDuration;
                this._pause();
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

            if (this._isPlaying && this._data.autoSelectRange) {
                this._hasRangeChanged();
            }

        }

        private _updateMediaActiveStates(): void {

            let contentAnnotation;

            for (let i = 0; i < this._contentAnnotations.length; i++) {

                contentAnnotation = this._contentAnnotations[i];
                const type: string = contentAnnotation.type.toString().toLowerCase();

                if (contentAnnotation.start <= this._canvasClockTime && contentAnnotation.end >= this._canvasClockTime) {

                    this._checkMediaSynchronization();

                    if (!contentAnnotation.active) {
                        this._synchronizeMedia();
                        contentAnnotation.active = true;
                        contentAnnotation.element.show();
                        contentAnnotation.timelineElement.addClass('active');
                    }

                    if (type === 'video' || type === 'audio') {

                        if (contentAnnotation.element[0].currentTime > contentAnnotation.element[0].duration - contentAnnotation.endOffset) {
                            this._pauseMedia(contentAnnotation.element[0]);
                        }

                    }

                } else {

                    if (contentAnnotation.active) {
                        contentAnnotation.active = false;
                        contentAnnotation.element.hide();
                        contentAnnotation.timelineElement.removeClass('active');
                        if (type === 'video' || type === 'audio') {
                            this._pauseMedia(contentAnnotation.element[0]);
                        }
                    }

                }

            }

            //this.logMessage('UPDATE MEDIA ACTIVE STATES at: '+ this._canvasClockTime + ' seconds.');
        }

        private _pauseMedia(media: HTMLMediaElement): void {
            const playPromise = media.play();

            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    // https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
                    media.pause();
                });
            } else {
                media.pause();
            }
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
                const type: string = contentAnnotation.type.toString().toLowerCase();

                if (type === 'video' || type === 'audio') {

                    this._setMediaCurrentTime(contentAnnotation.element[0], this._canvasClockTime - contentAnnotation.start + contentAnnotation.startOffset);

                    if (contentAnnotation.start <= this._canvasClockTime && contentAnnotation.end >= this._canvasClockTime) {
                        if (this._isPlaying) {
                            if (contentAnnotation.element[0].paused) {
                                var promise = contentAnnotation.element[0].play();
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
            }

            this.logMessage('SYNC MEDIA at: ' + this._canvasClockTime + ' seconds.');

        }

        private _checkMediaSynchronization(): void {

            let contentAnnotation;

            for (let i = 0, l = this._contentAnnotations.length; i < l; i++) {

                contentAnnotation = this._contentAnnotations[i];

                const type: string = contentAnnotation.type.toString().toLowerCase();

                if ((type === 'video' || type === 'audio') &&
                    (contentAnnotation.start <= this._canvasClockTime && contentAnnotation.end >= this._canvasClockTime)) {

                    const correctTime: number = (this._canvasClockTime - contentAnnotation.start + contentAnnotation.startOffset);
                    const factualTime: number = contentAnnotation.element[0].currentTime;

                    // off by 0.2 seconds
                    if (Math.abs(factualTime - correctTime) > 0.4) {

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
                    this._pause(true);
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
                        this._play(true);
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
                    this._$canvasContainer.height(<number>this.$playerElement.parent().height() - <number>$options.height());
                }

                this._render();
            }
        }

    }
}

namespace IIIFComponents.AVComponentCanvasInstance {
    export class Events {
        static NEXT_RANGE: string = 'nextrange';
        static PAUSECANVAS: string = 'pause';
        static PLAYCANVAS: string = 'play';
        static PREVIOUS_RANGE: string = 'previousrange';
    }
}