namespace IIIFComponents {

    export class CanvasInstance {
        
	    private _highPriorityFrequency: number = 25;
	    private _lowPriorityFrequency: number = 100;
        private _$canvasContainer: JQuery;
        private _$canvasDuration: JQuery;
        private _$canvasTime: JQuery;
        private _$controlsContainer: JQuery;
        private _$durationHighlight: JQuery;
        private _$optionsContainer: JQuery;
        private _$playButton: JQuery;
        private _$rangeTimelineContainer: JQuery;
        private _$timelineContainer: JQuery;
        private _$timelineItemContainer: JQuery;
        private _$timingControls: JQuery;
        private _$volumeControl: JQuery<HTMLInputElement>;
        private _canvasClockFrequency: number = 25;
        private _canvasHeight: number = 0;
        private _canvasWidth: number = 0;
        private _contentAnnotations: any[]; // todo: type as HTMLMediaElement?
        private _data: IAVComponentData;
        private _e: any;

        public $playerElement: JQuery;
        public canvas: Manifesto.ICanvas;
        public canvasClockDuration: number = 0; // todo: should these 0 values be undefined by default?
        public canvasClockInterval: number;
        public canvasClockStartDate: number = 0;
        public canvasClockTime: number = 0;
        public currentDuration: AVComponentObjects.Duration | null = null;
        public highPriorityInterval: number;
        public isPlaying: boolean = false;
        public isStalled: boolean = false;
        public logMessage: (message: string) => void;
        public lowPriorityInterval: number;
        public readyCanvasesCount: number = 0;
        public stallRequestedBy: any[] = []; //todo: type
        public wasPlaying: boolean = false;

        constructor(canvas: Manifesto.ICanvas, data: IAVComponentData) {
            this.canvas = canvas;
            this._data = data;
            this.$playerElement = $('<div class="player"></div>');
        }

        public init() {

            this._$canvasContainer = $('<div class="canvasContainer"></div>');
            this._$optionsContainer = $('<div class="optionsContainer"></div>');
            this._$timelineContainer = $('<div class="timelineContainer"></div>');
            this._$durationHighlight = $('<div class="durationHighlight"></div>');
            this._$timelineItemContainer = $('<div class="timelineItemContainer"></div>');
            this._$controlsContainer = $('<div class="controlsContainer"></div>');
            this._$playButton = $('<button class="playButton">' + this._data.content.play + '</button>');
            this._$timingControls = $('<span>' + this._data.content.currentTime + ': <span class="canvasTime"></span> / ' + this._data.content.duration + ': <span class="canvasDuration"></span></span>');
            this._$volumeControl = $('<input type="range" class="volume" min="0" max="1" step="0.01" value="1">') as JQuery<HTMLInputElement>;
            this._$canvasTime = this._$timingControls.find('.canvasTime');
            this._$canvasDuration = this._$timingControls.find('.canvasDuration');

            this._$controlsContainer.append(this._$playButton, this._$timingControls, this._$volumeControl);
            this._$timelineContainer.append(this._$durationHighlight);
            this._$optionsContainer.append(this._$timelineContainer, this._$timelineItemContainer, this._$controlsContainer);
            this.$playerElement.append(this._$canvasContainer, this._$optionsContainer);

            this.canvasClockDuration = <number>this.canvas.getDuration();

            const canvasWidth: number = this.canvas.getWidth();
            const canvasHeight: number = this.canvas.getHeight();

            if (!canvasWidth) {
                this._canvasWidth = <number>this.$playerElement.parent().width(); // this._data.defaultCanvasWidth;
            } else {
                this._canvasWidth = canvasWidth;
            }

            if (!canvasHeight) {
                this._canvasHeight = this._canvasWidth * this._data.defaultAspectRatio; //this._data.defaultCanvasHeight;
            } else {
                this._canvasHeight = canvasHeight;
            }

            const that = this;

            this._$playButton.on('click', () => {
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }	
            });

            this._$volumeControl.on('input', function() {
                that.setVolume(Number(this.value));
            });

            this._$volumeControl.on('change', function() {
                that.setVolume(Number(this.value));
            });

            this._$timelineContainer.slider({
                value: 0,
                step: 0.01,
                orientation: "horizontal",
                range: "min",
                max: that.canvasClockDuration,
                animate: false,			
                create: function(evt: any, ui: any) {
                    // on create
                },
                slide: function(evt: any, ui: any) {
                    that.setCurrentTime(ui.value);
                },
                stop: function(evt: any, ui: any) {
                    //this.setCurrentTime(ui.value);
                }
            });

            // create annotations

            this._contentAnnotations = [];

            const items = (<any>this.canvas).__jsonld.content[0].items; //todo: use canvas.getContent()

            if (items.length === 1) {
                this._$timelineItemContainer.hide();
            }

            for (let i = 0; i < items.length; i++) {

                const item = items[i];
                
                /*
                if (item.motivation != 'painting') {
                    return null;
                }
                */

                let mediaSource;

                if (item.body.type == 'TextualBody') {
                    mediaSource = item.body.value;
                } else if (Array.isArray(item.body) && item.body[0].type == 'Choice') {
                    // Choose first "Choice" item as body
                    const tmpItem = item;
                    item.body = tmpItem.body[0].items[0];
                    mediaSource = item.body.id.split('#')[0];
                } else {
                    mediaSource = item.body.id.split('#')[0];
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

                const spatial = /xywh=([^&]+)/g.exec(item.target);
                const temporal = /t=([^&]+)/g.exec(item.target);
                
                let xywh;

                if (spatial && spatial[1]) {
                    xywh = spatial[1].split(',');
                } else {
                    xywh = [0, 0, this._canvasWidth, this._canvasHeight];
                }

                let t;

                if(temporal && temporal[1]) {
                    t = temporal[1].split(',');
                } else {
                    t = [0, this.canvasClockDuration];
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

                const temporalOffsets = /t=([^&]+)/g.exec(item.body.id);

                let ot;

                if(temporalOffsets && temporalOffsets[1]) {
                    ot = temporalOffsets[1].split(',');
                } else {
                    ot = [null, null];
                }

                const offsetStart = (ot[0]) ? parseInt(<string>ot[0]) : ot[0],
                    offsetEnd = (ot[1]) ? parseInt(<string>ot[1]) : ot[1];
                
                const itemData: any = {
                    'type': item.body.type,
                    'source': mediaSource,
                    'start': startTime, 
                    'end': endTime, 
                    'top': percentageTop, 
                    'left': percentageLeft, 
                    'width': percentageWidth, 
                    'height': percentageHeight, 
                    'startOffset': offsetStart,
                    'endOffset': offsetEnd,
                    'active': false
                }

                this._renderMediaElement(itemData);
            }
        }

        public limitToRange(limit: boolean): void {

            if (limit) {

            } else {

            }
        }

        private _convertToPercentage(pixelValue: number, maxValue: number): number {
            const percentage: number = (pixelValue / maxValue) * 100;
            return percentage;
        }

        private _renderMediaElement(data: any): void {

            let $mediaElement;

            switch(data.type) {
                case 'Image':
                    $mediaElement = $('<img class="anno" src="' + data.source + '" />');
                    break;
                case 'Video':
                    $mediaElement = $('<video class="anno" src="' + data.source + '" />');
                    break;
                case 'Audio':
                    $mediaElement = $('<audio class="anno" src="' + data.source + '" />');
                    break;
                case 'TextualBody':
                    $mediaElement = $('<div class="anno">' + data.source + '</div>');
                    break;
                default:
                    return;
            }

            $mediaElement.css({
                top: data.top + '%',
                left: data.left + '%',
                width: data.width + '%',
                height: data.height + '%'
            }).hide();

            data.element = $mediaElement;

            if (data.type == 'Video' || data.type == 'Audio') {
                
                data.timeout = null;

                const that = this;

                data.checkForStall = function() {

                    const self = this;
                    
                    if (this.active) {
                        that.checkMediaSynchronization();
                        if (this.element.get(0).readyState > 0 && !this.outOfSync) {
                            that.playbackStalled(false, self);
                        } else {
                            that.playbackStalled(true, self);
                            if (this.timeout) {
                                window.clearTimeout(this.timeout);
                            }
                            this.timeout = window.setTimeout(function() {
                                self.checkForStall();
                            }, 1000);
                        }

                    } else {
                        that.playbackStalled(false, self);
                    }

                }
            }

            this._contentAnnotations.push(data);

            if (this.$playerElement) {
                this._$canvasContainer.append($mediaElement);
            }
            
            if (data.type == 'Video' || data.type == 'Audio') {

                const that = this;
                const self = data;

                $mediaElement.on('loadstart', function() {
                    //console.log('loadstart');
                    self.checkForStall();
                });

                $mediaElement.on('waiting', function() {
                    //console.log('waiting');
                    self.checkForStall();
                });

                $mediaElement.on('seeking', function() {
                    //console.log('seeking');
                    //self.checkForStall();
                });

                $mediaElement.on('loadedmetadata', function() {
                    that.readyCanvasesCount++;

                    if (that.readyCanvasesCount === that._contentAnnotations.length) {
                        that.setCurrentTime(0);

                        if (that._data.autoPlay) {
                            that.play();
                        }
            
                        that._$canvasDuration.text(AVComponentUtils.Utils.formatTime(that.canvasClockDuration));
                        
                        that.fire(AVComponent.Events.CANVASREADY);
                    }
                });

                $mediaElement.attr('preload', 'auto');
                
                (<any>$mediaElement.get(0)).load(); // todo: type
            }

            this._renderSyncIndicator(data);

        }

        public highlightDuration(): void {

            if (!this.currentDuration) {
                return;
            }

            // get the total length in seconds.
            const totalLength: number = this.canvasClockDuration;

            // get the length of the timeline container
            const timelineLength: number = <number>this._$timelineContainer.width();

            // get the ratio of seconds to length
            const ratio: number = timelineLength / totalLength;
            const start: number = this.currentDuration.start * ratio;
            const end: number = this.currentDuration.end * ratio;
            const width: number = end - start;

            // set the start position and width
            this._$durationHighlight.css({
                left: start,
                width: width
            })
        }

        public setVolume(value: number): void {

            for (let i = 0; i < this._contentAnnotations.length; i++) {
                const $mediaElement = this._contentAnnotations[i];
                $($mediaElement.element).prop("volume", value);
            }

        }

        private _renderSyncIndicator(mediaElementData: any) {

            const leftPercent: number = this._convertToPercentage(mediaElementData.start, this.canvasClockDuration);
            const widthPercent: number = this._convertToPercentage(mediaElementData.end - mediaElementData.start, this.canvasClockDuration);

            const $timelineItem: JQuery = $('<div class="timelineItem" title="'+ mediaElementData.source +'" data-start="'+ mediaElementData.start +'" data-end="'+ mediaElementData.end +'"></div>');

            $timelineItem.css({
                left: leftPercent + '%',
                width: widthPercent + '%'
            });

            const $lineWrapper: JQuery = $('<div class="lineWrapper"></div>');

            $timelineItem.appendTo($lineWrapper);

            mediaElementData.timelineElement = $timelineItem;

            if (this.$playerElement) {
                this._$timelineItemContainer.append($lineWrapper);
            }
        }

        public setCurrentTime(seconds: number): void { // seconds was originally a string or a number - didn't seem necessary
		
            // const secondsAsFloat: number = parseFloat(seconds.toString());

            // if (isNaN(secondsAsFloat)) {
            //     return;
            // }

            this.canvasClockTime = seconds; //secondsAsFloat;
            this.canvasClockStartDate = Date.now() - (this.canvasClockTime * 1000)

            this.logMessage('SET CURRENT TIME to: '+ this.canvasClockTime + ' seconds.');

            this.canvasClockUpdater();
            this.highPriorityUpdater();
            this.lowPriorityUpdater();
            this.synchronizeMedia();            
        }

        public play(withoutUpdate?: boolean): void {
            if (this.isPlaying) return;

            if (this.canvasClockTime === this.canvasClockDuration) {
                this.canvasClockTime = 0;
            }

            this.canvasClockStartDate = Date.now() - (this.canvasClockTime * 1000);

            const self = this;

            this.highPriorityInterval = window.setInterval(function() {
                self.highPriorityUpdater();
            }, this._highPriorityFrequency);

            this.lowPriorityInterval = window.setInterval(function() {
                self.lowPriorityUpdater();
            }, this._lowPriorityFrequency);

            this.canvasClockInterval = window.setInterval(function() {
                self.canvasClockUpdater();
            }, this._canvasClockFrequency);

            this.isPlaying = true;

            if (!withoutUpdate) {
                this.synchronizeMedia();
            }

            this._$playButton.removeClass('play');
            this._$playButton.addClass('pause');
            this._$playButton.text(this._data.content.pause);

            this.fire(AVComponent.Events.PLAYCANVAS);
            this.logMessage('PLAY canvas');
        }

        public pause(withoutUpdate?: boolean): void {
            window.clearInterval(this.highPriorityInterval);
            window.clearInterval(this.lowPriorityInterval);
            window.clearInterval(this.canvasClockInterval);

            this.isPlaying = false;

            if (!withoutUpdate) {
                this.highPriorityUpdater();
                this.lowPriorityUpdater();
                this.synchronizeMedia();
            }

            this._$playButton.removeClass('pause');
            this._$playButton.addClass('play');
            this._$playButton.text(this._data.content.play);

            this.fire(AVComponent.Events.PAUSECANVAS);
            this.logMessage('PAUSE canvas');
        }

        public canvasClockUpdater(): void {
            this.canvasClockTime = (Date.now() - this.canvasClockStartDate) / 1000;

            if (this.canvasClockTime >= this.canvasClockDuration) {
                this.canvasClockTime = this.canvasClockDuration;
                this.pause();
            }
        }

        public highPriorityUpdater(): void {

            this._$timelineContainer.slider({
                value: this.canvasClockTime
            });

            this._$canvasTime.text(AVComponentUtils.Utils.formatTime(this.canvasClockTime));
        }

        public lowPriorityUpdater(): void {
            this.updateMediaActiveStates();
        }

        public updateMediaActiveStates(): void {

            let mediaElement;

            for (let i = 0; i < this._contentAnnotations.length; i++) {

                mediaElement = this._contentAnnotations[i];

                if (mediaElement.start <= this.canvasClockTime && mediaElement.end >= this.canvasClockTime) {

                    this.checkMediaSynchronization();

                    if (!mediaElement.active) {
                        this.synchronizeMedia();
                        mediaElement.active = true;
                        mediaElement.element.show();
                        mediaElement.timelineElement.addClass('active');
                    }

                    if (mediaElement.type == 'Video' || mediaElement.type == 'Audio') {

                        if (mediaElement.element[0].currentTime > mediaElement.element[0].duration - mediaElement.endOffset) {
                            mediaElement.element[0].pause();
                        }

                    }

                } else {

                    if (mediaElement.active) {
                        mediaElement.active = false;
                        mediaElement.element.hide();
                        mediaElement.timelineElement.removeClass('active');
                        if (mediaElement.type == 'Video' || mediaElement.type == 'Audio') {
                            mediaElement.element[0].pause();
                        }
                    }

                }

            }

            //this.logMessage('UPDATE MEDIA ACTIVE STATES at: '+ this.canvasClockTime + ' seconds.');

        }

        public synchronizeMedia(): void {

            let mediaElement;

            for (let i = 0; i < this._contentAnnotations.length; i++) {

                mediaElement = this._contentAnnotations[i];
                
                if (mediaElement.type == 'Video' || mediaElement.type == 'Audio') {

                    mediaElement.element[0].currentTime = this.canvasClockTime - mediaElement.start + mediaElement.startOffset;

                    if (mediaElement.start <= this.canvasClockTime && mediaElement.end >= this.canvasClockTime) {
                        if (this.isPlaying) {
                            if (mediaElement.element[0].paused) {
                                var promise = mediaElement.element[0].play();
                                if (promise) {
                                    promise.catch(function(){});
                                }
                            }
                        } else {
                            mediaElement.element[0].pause();
                        }
                    } else {
                        mediaElement.element[0].pause();
                    }

                    if (mediaElement.element[0].currentTime > mediaElement.element[0].duration - mediaElement.endOffset) {
                        mediaElement.element[0].pause();
                    }
                }
            }

            this.logMessage('SYNC MEDIA at: '+ this.canvasClockTime + ' seconds.');
            
        }

        public checkMediaSynchronization(): void {
	
            let mediaElement;

            for (let i = 0, l = this._contentAnnotations.length; i < l; i++) {
                
                mediaElement = this._contentAnnotations[i];

                if ((mediaElement.type == 'Video' || mediaElement.type == 'Audio') && 
                    (mediaElement.start <= this.canvasClockTime && mediaElement.end >= this.canvasClockTime) ) {

                    const correctTime: number = (this.canvasClockTime - mediaElement.start + mediaElement.startOffset);
                    const factualTime: number = mediaElement.element[0].currentTime;

                    // off by 0.2 seconds
                    if (Math.abs(factualTime - correctTime) > 0.4) {
                        
                        mediaElement.outOfSync = true;
                        //this.playbackStalled(true, mediaElement);
                        
                        const lag: number = Math.abs(factualTime - correctTime);
                        this.logMessage('DETECTED synchronization lag: '+ Math.abs(lag) );
                        mediaElement.element[0].currentTime = correctTime;
                        //this.synchronizeMedia();

                    } else {
                        mediaElement.outOfSync = false;
                        //this.playbackStalled(false, mediaElement);
                    }
                }
            }
        }

        public playbackStalled(aBoolean: boolean, syncMediaRequestingStall: any): void {

            if (aBoolean) {

                if (this.stallRequestedBy.indexOf(syncMediaRequestingStall) < 0) {
                    this.stallRequestedBy.push(syncMediaRequestingStall);
                }

                if (!this.isStalled) {

                    if (this.$playerElement) {
                        this._showWorkingIndicator(this._$canvasContainer);
                    }

                    this.wasPlaying = this.isPlaying;
                    this.pause(true);
                    this.isStalled = aBoolean;
                }

            } else {

                const idx: number = this.stallRequestedBy.indexOf(syncMediaRequestingStall);
                
                if (idx >= 0) {
                    this.stallRequestedBy.splice(idx, 1);
                }

                if (this.stallRequestedBy.length === 0) {

                    this._hideWorkingIndicator();

                    if (this.isStalled && this.wasPlaying) {
                        this.play(true);
                    }

                    this.isStalled = aBoolean;
                }
            }
        }

        private _showWorkingIndicator($targetElement: JQuery): void {
            const workingIndicator: JQuery = $('<div class="workingIndicator">Waiting ...</div>');
            if ($targetElement.find('.workingIndicator').length == 0) {
                $targetElement.append(workingIndicator);
            }
            //console.log('show working');
        }

        private _hideWorkingIndicator() {
            $('.workingIndicator').remove();
            //console.log('hide working');
        }

        public resize(): void {
            if (this.$playerElement) {

                const containerWidth: number | undefined = this._$canvasContainer.width();

                if (containerWidth) {
                    this._$timelineContainer.width(containerWidth);

                    //const resizeFactorY: number = containerWidth / this.canvasWidth;
                    //$canvasContainer.height(this.canvasHeight * resizeFactorY);

                    const $options: JQuery = this.$playerElement.find('.optionsContainer');
                    this._$canvasContainer.height(<number>this.$playerElement.parent().height() - <number>$options.height());
                }

                this.highlightDuration();
            }
        }

        public on(name: string, callback: Function, ctx: any): void {
            var e = this._e || (this._e = {});

            (e[name] || (e[name] = [])).push({
                fn: callback,
                ctx: ctx
            });
        }

        public fire(name: string, ...args: any[]): void {
            var data = [].slice.call(arguments, 1);
            var evtArr = ((this._e || (this._e = {}))[name] || []).slice();
            var i = 0;
            var len = evtArr.length;

            for (i; i < len; i++) {
                evtArr[i].fn.apply(evtArr[i].ctx, data);
            }
        }
    }
}