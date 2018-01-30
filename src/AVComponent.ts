namespace IIIFComponents {

    export class AVComponent extends _Components.BaseComponent {

        private _currentCanvas: string | null = null;
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
                doubleClickMS: 350,
                limitToRange: false,
                content: <IAVComponentContent>{
                    currentTime: "Current Time",
                    duration: "Duration",
                    next: "Next",
                    pause: "Pause",
                    play: "Play",
                    previous: "Previous"
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
                const canvasInstance: CanvasInstance = this.canvasInstances[i];
                canvasInstance.destroy();
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
                canvasInstance.set(this._data);
            }

        }

        private _getCanvases(): Manifesto.ICanvas[] {
            if (this._data.helper) {
                return this._data.helper.getCanvases();
            }
            
            return [];
        }

        private _initCanvas(canvas: Manifesto.ICanvas): void {

            const canvasInstance: CanvasInstance = new CanvasInstance(canvas, this._data);
            canvasInstance.logMessage = this._logMessage.bind(this);   
            this._$element.append(canvasInstance.$playerElement);
            canvasInstance.init();
            this.canvasInstances.push(canvasInstance);

            canvasInstance.on(AVComponent.Events.CANVASREADY, () => {
                //that._logMessage('CREATED CANVAS: ' + canvasInstance.canvasClockDuration + ' seconds, ' + canvasInstance.canvasWidth + ' x ' + canvasInstance.canvasHeight + ' px.');
                this.fire(AVComponent.Events.CANVASREADY);
            }, false);

            // canvasInstance.on(AVComponent.Events.RESETCANVAS, () => {
            //     this.playCanvas(canvasInstance.canvas.id);
            // }, false);

            canvasInstance.on(AVComponent.Events.PREVIOUS_RANGE, () => {
                this._prevRange();
            }, false);

            canvasInstance.on(AVComponent.Events.NEXT_RANGE, () => {
                this._nextRage();
            }, false);
        }

        private _prevRange(): void {
            if (!this._data || !this._data.helper) {
                return;
            }

            const prevRange: Manifesto.IRange | null = this._data.helper.getPreviousRange();

            if (prevRange) {
                const canvasIds: string[] = prevRange.getCanvasIds();

                if (canvasIds.length) {
                    this._data.helper.rangeId = prevRange.id;
                    this.playCanvas(canvasIds[0]);
                    this.fire(AVComponent.Events.PREVIOUS_RANGE);
                }

            } else {
                // no previous range. rewind instead.
                this._rewind();
            }
        }

        private _nextRage(): void {
            if (!this._data || !this._data.helper) {
                return;
            }

            const nextRange: Manifesto.IRange | null = this._data.helper.getNextRange();

            if (nextRange) {
                const canvasIds: string[] = nextRange.getCanvasIds();

                if (canvasIds.length) {
                    this._data.helper.rangeId = nextRange.id;
                    this.playCanvas(canvasIds[0]);
                    this.fire(AVComponent.Events.NEXT_RANGE);
                }                
            }
        }

        public getCanvasInstanceById(canvasId: string): CanvasInstance | null {
            
            canvasId = manifesto.Utils.normaliseUrl(canvasId);
    
            for (let i = 0; i < this.canvasInstances.length; i++) {
    
                const canvasInstance: IIIFComponents.CanvasInstance = this.canvasInstances[i];
    
                if (canvasInstance.canvas && canvasInstance.canvas.id) {
                    const canvasInstanceId: string = manifesto.Utils.normaliseUrl(canvasInstance.canvas.id);
                    
                    if (canvasInstanceId === canvasId) {
                        return canvasInstance;
                    }
                }
            }
    
            return null;
        }

        private _getCurrentCanvas(): CanvasInstance | null {
            if (this._currentCanvas) {
                return this.getCanvasInstanceById(this._currentCanvas);
            }

            return null;
        }
        
        private _rewind(): void {
            const canvasInstance: CanvasInstance | null = this._getCurrentCanvas();

            if (canvasInstance) {
                canvasInstance.unhighlightDuration();
                canvasInstance.rewind();
            }
        }

        public playCanvas(canvasId: string): void {

            this.showCanvas(canvasId);

            const canvasInstance: CanvasInstance | null = this.getCanvasInstanceById(canvasId);
            
            if (canvasInstance) {

                this._currentCanvas = canvasId;

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

        public playRange(rangeId: string): void {

            if (!this._data || !this._data.helper) {
                return;
            }

            const range: Manifesto.IRange | null = this._data.helper.getRangeById(rangeId);

            if (range) {
                this._data.helper.rangeId = rangeId;

                if (range.canvases) {
                    const canvasId = range.canvases[0];
                    this.playCanvas(canvasId);
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
                canvasInstance.resize();
            }

        }
    }
}

namespace IIIFComponents.AVComponent {
    export class Events {
        static CANVASREADY: string = 'canvasready';
        static LOG: string = 'log';
        static NEXT_RANGE: string = 'nextrange';
        static PAUSECANVAS: string = 'pause';
        static PLAYCANVAS: string = 'play';
        static PREVIOUS_RANGE: string = 'previousrange';
    }
}

(function(g:any) {
    if (!g.IIIFComponents) {
        g.IIIFComponents = IIIFComponents;
    } else {
        g.IIIFComponents.AVComponent = IIIFComponents.AVComponent;
    }
})(global);