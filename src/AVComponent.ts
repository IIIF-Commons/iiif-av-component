namespace IIIFComponents {

    export class AVComponent extends _Components.BaseComponent {

        private _data: IAVComponentData = this.data();
        public options: _Components.IBaseComponentOptions;
        public canvasInstances: CanvasInstance[] = [];

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
                defaultAspectRatio: 0.56,
                limitToRange: false,
                content: <IAVComponentContent>{
                    play: "Play",
                    pause: "Pause",
                    currentTime: "Current Time",
                    duration: "Duration"
                }
            }
        }

        public set(data: IAVComponentData): void {

            // changing any of these data properties forces a reload.
            if (this._propertiesChanged(data, ['helper'])) {
                $.extend(this._data, data);
                // reset all global properties and terminate all running processes
                // create canvases
                this._reset();
            } else {
                // no need to reload, just update.
                $.extend(this._data, data);
            }

            // update
            this._update();
            
            // resize everything
            this._resize();
        }

        private _propertiesChanged(data: IAVComponentData, properties: string[]): boolean {
            let propChanged: boolean = false;
            
            for (var i = 0; i < properties.length; i++) {
                propChanged = this._propertyChanged(data, properties[i]);
                if (propChanged) {
                    break;
                }
            }
    
            return propChanged;
        }

        private _propertyChanged(data: IAVComponentData, propertyName: string): boolean {
            return !!data[propertyName] && this._data[propertyName] !== data[propertyName];
        }

        private _reset(): void {

            for (let i = 0; i < this.canvasInstances.length; i++) {
                window.clearInterval(this.canvasInstances[i].highPriorityInterval);
                window.clearInterval(this.canvasInstances[i].lowPriorityInterval);
                window.clearInterval(this.canvasInstances[i].canvasClockInterval);
            }

            this.canvasInstances = [];

            this._$element.empty();

            const canvases: Manifesto.ICanvas[] = this._getCanvases();

			for (let i = 0; i < canvases.length; i++) {
				this._initCanvas(canvases[i]);
            }
        }

        private _update(): void {

            for (let i = 0; i < this.canvasInstances.length; i++) {
                const canvasInstance: CanvasInstance = this.canvasInstances[i];
                canvasInstance.limitToRange(this._data.limitToRange);
            }

        }

        private _getCanvases(): Manifesto.ICanvas[] {
            if (this._data.helper) {
                return this._data.helper.getCanvases();
            }
            
            return [];
        }

        private _initCanvas(canvas: Manifesto.ICanvas): void {
    
            const $player: JQuery = $('<div class="player"></div>');
            const $canvasContainer: JQuery = $('<div class="canvasContainer"></div>');
            const $optionsContainer: JQuery = $('<div class="optionsContainer"></div>');
            const $timelineContainer: JQuery = $('<div class="timelineContainer"></div>');
            const $durationHighlight: JQuery = $('<div class="durationHighlight"></div>');
            const $timelineItemContainer: JQuery = $('<div class="timelineItemContainer"></div>');
            const $controlsContainer: JQuery = $('<div class="controlsContainer"></div>');
            const $playButton: JQuery = $('<button class="playButton">' + this._data.content.play + '</button>');
            const $timingControls: JQuery = $('<span>' + this._data.content.currentTime + ': <span class="canvasTime"></span> / ' + this._data.content.duration + ': <span class="canvasDuration"></span></span>');
            const $volumeControl: JQuery<HTMLInputElement> = $('<input type="range" class="volume" min="0" max="1" step="0.01" value="1">') as JQuery<HTMLInputElement>;

            $controlsContainer.append($playButton, $timingControls, $volumeControl);
            $timelineContainer.append($durationHighlight);
            $optionsContainer.append($timelineContainer, $timelineItemContainer, $controlsContainer);
            $player.append($canvasContainer, $optionsContainer);

            this._$element.append($player);

            const canvasInstance: CanvasInstance = new CanvasInstance(canvas);

            const canvasWidth: number = canvas.getWidth();
            const canvasHeight: number = canvas.getHeight();

            if (!canvasWidth) {
                canvasInstance.canvasWidth = <number>this._$element.width(); // this._data.defaultCanvasWidth;
            } else {
                canvasInstance.canvasWidth = canvasWidth;
            }

            if (!canvasHeight) {
                canvasInstance.canvasHeight = canvasInstance.canvasWidth * this._data.defaultAspectRatio; //this._data.defaultCanvasHeight;
            } else {
                canvasInstance.canvasHeight = canvasHeight;
            }

            canvasInstance.$playerElement = $player;
            canvasInstance.logMessage = this._logMessage.bind(this);

            canvasInstance.on(AVComponent.Events.PLAYCANVAS, function() {
                $playButton.removeClass('play');
                $playButton.addClass('pause');
                $playButton.text(this._data.content.pause);
            }, this);

            canvasInstance.on(AVComponent.Events.PAUSECANVAS, function() {
                $playButton.removeClass('pause');
                $playButton.addClass('play');
                $playButton.text(this._data.content.play);
            }, this);

            $timelineContainer.slider({
                value: 0,
                step: 0.01,
                orientation: "horizontal",
                range: "min",
                max: canvasInstance.canvasClockDuration,
                animate: false,			
                create: function(evt: any, ui: any) {
                    // on create
                },
                slide: function(evt: any, ui: any) {
                    canvasInstance.setCurrentTime(ui.value);
                },
                stop: function(evt: any, ui: any) {
                    //canvasInstance.setCurrentTime(ui.value);
                }
            });

            this.canvasInstances.push(canvasInstance);

            canvasInstance.initContents();

            $playButton.on('click', () => {

                if (canvasInstance.isPlaying) {
                    canvasInstance.pause();
                } else {
                    canvasInstance.play();
                }
	
            });

            $volumeControl.on('input', function() {
                canvasInstance.setVolume(Number(this.value));
            });

            $volumeControl.on('change', function() {
                canvasInstance.setVolume(Number(this.value));
            });

            const that = this;

            canvasInstance.on('canvasready', function() {

                canvasInstance.setCurrentTime(0);

                if (that.options.data.autoPlay) {
                    canvasInstance.play();
                }
    
                $timingControls.find('.canvasDuration').text(AVComponentUtils.Utils.formatTime(canvasInstance.canvasClockDuration));
    
                that._logMessage('CREATED CANVAS: ' + canvasInstance.canvasClockDuration + ' seconds, ' + canvasInstance.canvasWidth + ' x ' + canvasInstance.canvasHeight + ' px.');

                that.fire(AVComponent.Events.CANVASREADY);

            }, false);

        }

        public getCanvasInstanceById(canvasId: string): CanvasInstance | null {
            
            canvasId = manifesto.Utils.normaliseUrl(canvasId);
    
            for (let i = 0; i < this.canvasInstances.length; i++) {
    
                const canvasInstance: IIIFComponents.CanvasInstance = this.canvasInstances[i];
    
                if (canvasInstance.data && canvasInstance.data.id) {
                    const canvasInstanceId: string = manifesto.Utils.normaliseUrl(canvasInstance.data.id);
                    
                    if (canvasInstanceId === canvasId) {
                        return canvasInstance;
                    }
                }
            }
    
            return null;
        }

        public play(canvasId: string): void {

            this.showCanvas(canvasId);

            const canvasInstance: CanvasInstance | null = this.getCanvasInstanceById(canvasId);
            
            if (canvasInstance) {
                const temporal: RegExpExecArray | null = /t=([^&]+)/g.exec(canvasId);
                
                if (temporal && temporal.length > 1) {
                    const rangeTiming: string[] = temporal[1].split(',');
                    const duration: AVComponentObjects.Duration = new AVComponentObjects.Duration(Number(rangeTiming[0]), Number(rangeTiming[1]));
                    canvasInstance.currentDuration = duration;
                    canvasInstance.highlightDuration();
                    canvasInstance.setCurrentTime(duration.start);
                    canvasInstance.play();
                }
            }
        }

        public showCanvas(canvasId: string): void {

            // pause all canvases
            for (var i = 0; i < this.canvasInstances.length; i++) {
                this.canvasInstances[i].pause();
            }

            // hide all players
            this._$element.find('.player').hide();

            const canvasInstance: CanvasInstance | null = this.getCanvasInstanceById(canvasId);

            if (canvasInstance && canvasInstance.$playerElement) {
                canvasInstance.$playerElement.show();
            }
        }

        private _logMessage(message: string): void {
            this.fire(AVComponent.Events.LOG, message);
        }

        public resize(): void {
            this._resize();
        }

        protected _resize(): void {

            // loop through all canvases resizing their elements

            for (let i = 0; i < this.canvasInstances.length; i++) {

                const canvasInstance: CanvasInstance = this.canvasInstances[i];

                if (canvasInstance.$playerElement) {
                    const $canvasContainer = canvasInstance.$playerElement.find('.canvasContainer');
                    const $timelineContainer = canvasInstance.$playerElement.find('.timelineContainer');

                    const containerWidth: number | undefined = $canvasContainer.width();

                    if (containerWidth) {
                        $timelineContainer.width(containerWidth);

                        //const resizeFactorY: number = containerWidth / canvasInstance.canvasWidth;
                        //$canvasContainer.height(canvasInstance.canvasHeight * resizeFactorY);

                        const $options: JQuery = canvasInstance.$playerElement.find('.optionsContainer');
                        $canvasContainer.height(<number>this._$element.height() - <number>$options.height());
                    }

                    canvasInstance.highlightDuration();
                    
                }

            }

        }
    }
}

namespace IIIFComponents.AVComponent {
    export class Events {
        static CANVASREADY: string = 'canvasready';
        static PLAYCANVAS: string = 'play';
        static PAUSECANVAS: string = 'pause';
        static LOG: string = 'log';
    }
}

(function(g:any) {
    if (!g.IIIFComponents) {
        g.IIIFComponents = IIIFComponents;
    } else {
        g.IIIFComponents.AVComponent = IIIFComponents.AVComponent;
    }
})(global);