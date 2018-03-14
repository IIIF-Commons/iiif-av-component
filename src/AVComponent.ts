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
                constrainNavigationToRange: false,
                defaultAspectRatio: 0.56,
                doubleClickMS: 350,
                limitToRange: false,
                content: <IAVComponentContent>{
                    currentTime: "Current Time",
                    duration: "Duration",
                    mute: "Mute",
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
                this._data = Object.assign(this._data, data);
                // reset all global properties and terminate all running processes
                // create canvases
                this._reset();
                return;
            }
            
            if (this._propertyChanged(data, 'rangeId') && data.rangeId) {

                this._data = Object.assign(this._data, data);

                if (!this._data.helper) {
                    console.warn('must pass a helper object');
                    return;
                }

                const range: Manifesto.IRange | null = this._data.helper.getRangeById(<string>this._data.rangeId);

                if (!range) {
                    console.warn('range not found');
                    return;
                }

                // todo: should invoke and action like helper.setRange(id) which updates the internal state using redux
                this._data.helper.rangeId = <string>this._data.rangeId;

                if (range.canvases) {
                    const canvasId = range.canvases[0];

                    const canvasInstance: CanvasInstance | null = this.getCanvasInstanceById(canvasId);
                    
                    if (canvasInstance) {

                        // get the temporal part of the canvas id
                        const temporal: RegExpExecArray | null = /t=([^&]+)/g.exec(canvasId);
                        
                        if (temporal && temporal.length > 1) {
                            const rangeTiming: string[] = temporal[1].split(',');
                            const duration: AVComponentObjects.Duration = new AVComponentObjects.Duration(Number(rangeTiming[0]), Number(rangeTiming[1]));
                            canvasInstance.set({
                                currentDuration: duration
                            });
                            canvasInstance.play();
                        }

                        if (this._data.canvasId && this._data.canvasId !== canvasId) {
                            this.set({
                                canvasId: canvasId
                            });
                        }
                    }
                }
            } 
            
            this._data = Object.assign(this._data, data);

            this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
                canvasInstance.set(<IAVCanvasInstanceData>this._data);
            });
            
            this._render();
            this._resize();
        }

        private _propertiesChanged(data: IAVComponentData, properties: string[]): boolean {
            let propChanged: boolean = false;
            
            for (let i = 0; i < properties.length; i++) {
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

        private _render(): void {

            if (!this._data || !this._data.canvasId) return;

            const currentCanvasInstance: CanvasInstance | null = this.getCanvasInstanceById(this._data.canvasId);

            this.canvasInstances.forEach((canvasInstance: CanvasInstance, index: number) => {
                if (canvasInstance !== currentCanvasInstance) {
                    canvasInstance.pause();
                    canvasInstance.$playerElement.hide();
                } else {
                    canvasInstance.$playerElement.show();
                }
            });
        }

        private _reset(): void {

            this.canvasInstances.forEach((canvasInstance: CanvasInstance, index: number) => {
                canvasInstance.destroy();
            });

            this.canvasInstances = [];

            this._$element.empty();

            const canvases: Manifesto.ICanvas[] = this._getCanvases();

			canvases.forEach((canvas: Manifesto.ICanvas) => {
                this._initCanvas(canvas);
            });

        }

        private _getCanvases(): Manifesto.ICanvas[] {
            if (this._data.helper) {
                return this._data.helper.getCanvases();
            }
            
            return [];
        }

        private _initCanvas(canvas: Manifesto.ICanvas): void {

            const canvasInstance: CanvasInstance = new CanvasInstance({
                target: document.createElement('div'),
                data: Object.assign({}, { canvas: canvas }, this._data)
            });

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

            canvasInstance.on(AVComponent.Events.NO_RANGE, () => {
                this.fire(AVComponent.Events.NO_RANGE);
            }, false);
        }

        private _prevRange(): void {
            if (!this._data || !this._data.helper) {
                return;
            }

            const prevRange: Manifesto.IRange | null = this._data.helper.getPreviousRange();

            if (prevRange) {
                // todo: eventually this should happen automatically using redux in manifold
                // instead of helper.getPreviousRange() it should invoke and action like helper.previousRange() which updates the internal state
                this._data.helper.rangeId = prevRange.id;
                this.playRange(prevRange.id);
                this.fire(AVComponent.Events.RANGE_CHANGED);
            } else {
                // no previous range. rewind.
                this._rewind();
            }
        }

        private _nextRage(): void {
            if (!this._data || !this._data.helper) {
                return;
            }

            const nextRange: Manifesto.IRange | null = this._data.helper.getNextRange();

            if (nextRange) {
                // todo: eventually this should happen automatically using redux in manifold
                // instead of helper.getNextRange() it should invoke and action like helper.nextRange() which updates the internal state
                this._data.helper.rangeId = nextRange.id;
                this.playRange(nextRange.id);
                this.fire(AVComponent.Events.RANGE_CHANGED);              
            }
        }

        public getCanvasInstanceById(canvasId: string): CanvasInstance | null {
            
            canvasId = manifesto.Utils.normaliseUrl(canvasId);
    
            for (let i = 0; i < this.canvasInstances.length; i++) {
    
                const canvasInstance: IIIFComponents.CanvasInstance = this.canvasInstances[i];
                
                const id: string | null = canvasInstance.getCanvasId();

                if (id) {
                    const canvasInstanceId: string = manifesto.Utils.normaliseUrl(id);

                    if (canvasInstanceId === canvasId) {
                        return canvasInstance;
                    }
                }
                
            }
    
            return null;
        }

        private _getCurrentCanvas(): CanvasInstance | null {
            if (this._data.canvasId) {
                return this.getCanvasInstanceById(this._data.canvasId);
            }

            return null;
        }
        
        private _rewind(): void {

            if (this._data.limitToRange) {
                return;
            }
            
            const canvasInstance: CanvasInstance | null = this._getCurrentCanvas();

            if (canvasInstance) {
                canvasInstance.set({
                    currentDuration: undefined
                });
                canvasInstance.rewind();                
            }
        }

        public playRange(rangeId: string): void {
            this.set({
                rangeId: rangeId
            });
        }

        public showCanvas(canvasId: string): void {
            this.set({
                canvasId: canvasId
            });
        }

        private _logMessage(message: string): void {
            this.fire(AVComponent.Events.LOG, message);
        }

        public resize(): void {
            this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
                canvasInstance.resize();
            });
        }
    }
}

namespace IIIFComponents.AVComponent {
    export class Events {
        static CANVASREADY: string = 'canvasready';
        static LOG: string = 'log';
        static NEXT_RANGE: string = 'nextrange';
        static NO_RANGE: string = 'norange';
        static PAUSECANVAS: string = 'pause';
        static PLAYCANVAS: string = 'play';
        static PREVIOUS_RANGE: string = 'previousrange';
        static RANGE_CHANGED: string = 'rangechanged';
    }
}

(function(g:any) {
    if (!g.IIIFComponents) {
        g.IIIFComponents = IIIFComponents;
    } else {
        g.IIIFComponents.AVComponent = IIIFComponents.AVComponent;
    }
})(global);