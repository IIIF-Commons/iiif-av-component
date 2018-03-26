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

            const oldData: IAVComponentData = Object.assign({}, this._data);
            this._data = Object.assign(this._data, data);
            const diff: string[] = AVComponentUtils.Utils.diff(oldData, this._data);

            // changing any of these data properties forces a reload.
            if (diff.includes('helper')) {
                // reset all global properties and terminate all running processes
                // create canvases
                this._reset();
                return;
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

                const currentCanvasInstance: CanvasInstance | null = this._getCanvasInstanceById(this._data.canvasId);

                this.canvasInstances.forEach((canvasInstance: CanvasInstance, index: number) => {
                    if (canvasInstance !== currentCanvasInstance) {
                        canvasInstance.set({ 
                            visible: false,
                            limitToRange: false
                        });
                    } else {
                        canvasInstance.set({ visible: true });
                    }
                });
            }
            
            if (diff.includes('range') && this._data.range) {

                const range: Manifesto.IRange | null = this._data.helper.getRangeById(this._data.range.rangeId);

                if (!range) {
                    console.warn('range not found');
                } else {

                    if (range.canvases) {
                        const canvasId = Manifesto.Utils.normaliseUrl(range.canvases[0]);
    
                        // get canvas by normalised id (without temporal part)
                        const canvasInstance: CanvasInstance | null = this._getCanvasInstanceById(canvasId);
                        
                        if (canvasInstance) {
    
                            const canvasRange: AVComponentObjects.CanvasRange = new AVComponentObjects.CanvasRange(range);
 
                            // if not using the correct canvasinstance, switch to it
                            if (this._data.canvasId && Manifesto.Utils.normaliseUrl(this._data.canvasId) !== canvasId) {

                                this.set({
                                    canvasId: canvasId,
                                    range: canvasRange
                                });

                            } else {

                                canvasInstance.set({
                                    range: canvasRange
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

            if (this.canvasInstances.length > 0) {
                this.set({
                    canvasId: <string>this.canvasInstances[0].getCanvasId()
                });
            }

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

            canvasInstance.on(AVComponentCanvasInstance.Events.PREVIOUS_RANGE, () => {
                this._prevRange();
            }, false);

            canvasInstance.on(AVComponentCanvasInstance.Events.NEXT_RANGE, () => {
                this._nextRange();
            }, false);

            canvasInstance.on(AVComponent.Events.RANGE_CHANGED, (rangeId: string | null) => {
                this.fire(AVComponent.Events.RANGE_CHANGED, rangeId);
            }, false);
        }

        private _prevRange(): void {
            if (!this._data || !this._data.helper) {
                return;
            }

            const prevRange: Manifesto.IRange | null = this._data.helper.getPreviousRange();

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

            const nextRange: Manifesto.IRange | null = this._data.helper.getNextRange();

            if (nextRange) {
                this.playRange(nextRange.id);         
            }
        }

        private _getCanvasInstanceById(canvasId: string): CanvasInstance | null {
            
            canvasId = Manifesto.Utils.normaliseUrl(canvasId);
    
            for (let i = 0; i < this.canvasInstances.length; i++) {
    
                const canvasInstance: IIIFComponents.CanvasInstance = this.canvasInstances[i];
                
                const id: string | null = canvasInstance.getCanvasId();

                if (id) {
                    const canvasInstanceId: string = Manifesto.Utils.normaliseUrl(id);

                    if (canvasInstanceId === canvasId) {
                        return canvasInstance;
                    }
                }
                
            }
    
            return null;
        }

        // private _getCurrentRange(): AVComponentObjects.CanvasRange | null {

        //     if (!this._data.helper || !this._data.helper.rangeId) {
        //         return null;
        //     }

        //     const range: Manifesto.IRange | null = this._data.helper.getRangeById(this._data.helper.rangeId);

        //     if (range) {
        //         const canvasRange: AVComponentObjects.CanvasRange = new AVComponentObjects.CanvasRange(range);
        //         return canvasRange;
        //     }

        //     return null;
        // }

        private _getCurrentCanvas(): CanvasInstance | null {
            if (this._data.canvasId) {
                return this._getCanvasInstanceById(this._data.canvasId);
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
                    range: undefined
                });             
            }
        }

        public playRange(rangeId: string): void {

            if (!this._data.helper) {
                return;
            }

            const range: Manifesto.IRange | null = this._data.helper.getRangeById(rangeId);

            if (range) {
                const canvasRange: AVComponentObjects.CanvasRange = new AVComponentObjects.CanvasRange(range);

                this.set({
                    range: canvasRange
                });
            }
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