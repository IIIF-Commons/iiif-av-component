namespace IIIFComponents {

    export class AVComponent extends _Components.BaseComponent {

        public options: _Components.IBaseComponentOptions;
        private _defaultCanvasHeight: number = 400; // todo: remove hard-coded value
        private _defaultCanvasWidth: number = 600; // todo: remove hard-coded value

        public canvasInstances: any[] = [];

        constructor(options: _Components.IBaseComponentOptions) {
            super(options);

            this._init();
            this._resize();
        }

        protected _init(): boolean {
            var success: boolean = super._init();

            if (!success) {
                console.error("Component failed to initialise");
            }

            return success;
        }

        public data(): IAVComponentData {
            return <IAVComponentData> {
                helper: null
            }
        }

        public set(data: IAVComponentData): void {

            this.options.data = data;

            // reset all global properties and terminate all running processes
            this._reset();

            // render ui
            this._render();
            
            // resize everything
            this._resize();
        }

        private _reset(): void {
            for (let i = 0; i < this.canvasInstances.length; i++) {
                window.clearInterval(this.canvasInstances[i].highPriorityInterval);
                window.clearInterval(this.canvasInstances[i].lowPriorityInterval);
                window.clearInterval(this.canvasInstances[i].canvasClockInterval);
            }

            this.canvasInstances = [];
        }

        private _render(): void {

            this._$element.empty();

            const canvases: Manifesto.ICanvas[] = this._getCanvases();

			for (let i = 0; i < canvases.length; i++) {
				this._initCanvas(canvases[i]);
			}
        }

        private _getCanvases(): Manifesto.ICanvas[] {
            return this.options.data.helper.getCanvases();
        }

        private _initCanvas(canvas: Manifesto.ICanvas) {
    
            const $player = $('<div class="player"></div>');
            const $canvasContainer = $('<div class="canvasContainer"></div>');
            const $timelineContainer = $('<div class="timelineContainer"></div>');
            const $timelineItemContainer = $('<div class="timelineItemContainer"></div>');
            const $controlsContainer = $('<div class="controlsContainer"></div>');
            const $playButton = $('<button class="playButton">Play</button>');
            const $pauseButton = $('<button class="pauseButton">Pause</button>');
            const $timingControls = $('<span>Current Time: <span class="canvasTime"></span> / Duration: <span class="canvasDuration"></span></span>');

            $controlsContainer.append($playButton, $pauseButton, $timingControls);
            $player.append($canvasContainer, $timelineContainer, $timelineItemContainer, $controlsContainer);

            this._$element.append($player);

            const canvasInstance: CanvasInstance = new CanvasInstance(canvas);
            const canvasWidth: number = canvas.getWidth();
            const canvasHeight: number = canvas.getHeight();

            if (!canvasWidth) {
                canvasInstance.canvasWidth = this._defaultCanvasWidth;
            } else {
                canvasInstance.canvasWidth = canvasWidth;
            }
            if (!canvasHeight) {
                canvasInstance.canvasHeight = this._defaultCanvasHeight;
            } else {
                canvasInstance.canvasHeight = canvasHeight;
            }

            canvasInstance.$playerElement = $player;
            canvasInstance.logMessage = this._logMessage.bind(this);

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
                canvasInstance.playCanvas();	
            });

            $pauseButton.on('click', () => {
                canvasInstance.pauseCanvas();	
            });
            
            canvasInstance.setCurrentTime(0);

            $timingControls.find('.canvasDuration').text(AVComponentUtils.Utils.formatTime(canvasInstance.canvasClockDuration));

            this._logMessage('CREATED CANVAS: '+ canvasInstance.canvasClockDuration +' seconds, '+ canvasInstance.canvasWidth +' x '+ canvasInstance.canvasHeight+' px.');
        }

        private _logMessage(message: string): void {
            this.fire(AVComponent.Events.LOG, message);
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

                        const resizeFactorY: number = containerWidth / canvasInstance.canvasWidth;
                        //const newHeight: number = canvasInstance.canvasHeight * resizeFactorY; not used

                        $canvasContainer.height(canvasInstance.canvasHeight * resizeFactorY);
                    }
                    
                }

            }

        }
    }
}

namespace IIIFComponents.AVComponent {
    export class Events {
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