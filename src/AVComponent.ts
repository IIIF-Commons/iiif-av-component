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
                virtualCanvasEnabled: true,
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
                            canvasInstance.set({ visible: true });
                        }
                    });

                }
                
            }

            if (diff.includes('virtualCanvasEnabled')) {

                this.set({
                    range: undefined
                });

                if (this._data.virtualCanvasEnabled) {
                    // find the virtual canvas and show it.
                    // hide all other canvases.
                    this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {   
                        if (canvasInstance.isVirtual()) {
                            canvasInstance.set({ 
                                visible: true,
                                range: undefined
                            });
                        } else {
                            canvasInstance.set({ 
                                visible: false,
                                range: undefined
                            });
                        }
                    });
                } else {

                    // find the virtual canvas and hide it.                    
                    this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {   
                        if (canvasInstance.isVirtual()) {
                            canvasInstance.set({ 
                                visible: false,
                                range: undefined
                            });
                        } else {
                            canvasInstance.set({ 
                                range: undefined
                            });
                        }
                    });

                    // show first non-virtual canvas.
                    for (let i = 0; i < this.canvasInstances.length; i++) {
                        const canvasInstance: CanvasInstance = this.canvasInstances[i];

                        if (!canvasInstance.isVirtual()) {
                            canvasInstance.set({ 
                                visible: true,
                                range: undefined
                            });
                        } else {
                            canvasInstance.set({ 
                                range: undefined
                            });
                        }
                    }
                    
                }               

            }
            
            if (diff.includes('range') && this._data.range) {

                let range: Manifesto.IRange | null = this._data.helper.getRangeById(this._data.range.id);

                if (!range) {
                    console.warn('range not found');
                } else {

                    let canvasId: string | undefined = AVComponentUtils.Utils.getFirstTargetedCanvasId(range);

                    if (canvasId) {

                        // get canvas by normalised id (without temporal part)
                        const canvasInstance: CanvasInstance | undefined = this._getCanvasInstanceById(canvasId);
                        
                        if (canvasInstance) {
                            
                            if (canvasInstance.isVirtual() && this._data.virtualCanvasEnabled) {                                
                                if (canvasInstance.includesVirtualSubCanvas(canvasId)) {
                                    canvasId = canvasInstance.getCanvasId();

                                    // use the retargeted range
                                    for (let i = 0; i < canvasInstance.ranges.length; i++) {
                                        const r: Manifesto.IRange = canvasInstance.ranges[i];

                                        if (r.id === range.id) {
                                            range = r;
                                            break;
                                        }
                                    }
                                }
                            }

                            // if not using the correct canvasinstance, switch to it                    
                            if (this._data.canvasId && 
                                ((this._data.canvasId.includes('://')) ? Manifesto.Utils.normaliseUrl(this._data.canvasId) : this._data.canvasId) !== canvasId) {

                                this.set({
                                    canvasId: canvasId,
                                    range: Object.assign({}, range) // force diff
                                });

                            } else {

                                canvasInstance.set({
                                    range: range
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

            if (this._data && this._data.helper) {

                // if the manifest has an auto-advance behavior, join the canvases into a single "virtual" canvas
                const behavior: Manifesto.Behavior | null = this._data.helper.manifest.getBehavior();
                const canvases: Manifesto.ICanvas[] = this._getCanvases();

                if (behavior && behavior.toString() === manifesto.Behavior.autoadvance().toString()) {

                    const virtualCanvas: AVComponentObjects.VirtualCanvas = new AVComponentObjects.VirtualCanvas();

                    canvases.forEach((canvas: Manifesto.ICanvas) => {
                        virtualCanvas.addCanvas(canvas);
                    });

                    this._initCanvas(virtualCanvas);

                }                

                // all canvases need to be individually navigable
                canvases.forEach((canvas: Manifesto.ICanvas) => {
                    this._initCanvas(canvas);
                });                

                if (this.canvasInstances.length > 0) {
                    this._data.canvasId = <string>this.canvasInstances[0].getCanvasId()
                }
            }
        }

        private _getCanvases(): Manifesto.ICanvas[] {
            if (this._data.helper) {
                return this._data.helper.getCanvases();
            }
            
            return [];
        }

        private _initCanvas(canvas: Manifesto.ICanvas | AVComponentObjects.VirtualCanvas): void {

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

            canvasInstance.on(AVVolumeControl.Events.VOLUME_CHANGED, (volume: number) => {
                this._setCanvasInstanceVolumes(volume);
                this.fire(AVVolumeControl.Events.VOLUME_CHANGED, volume);
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

        private _setCanvasInstanceVolumes(volume: number): void {

            this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
                canvasInstance.set({
                    volume: volume
                });
            });
        }

        private _getCanvasInstanceById(canvasId: string): CanvasInstance | undefined {
            
            canvasId = (canvasId.includes('://')) ? Manifesto.Utils.normaliseUrl(canvasId) : canvasId;
    
            // if virtual canvas is enabled, check for that first
            if (this._data.virtualCanvasEnabled) {

                for (let i = 0; i < this.canvasInstances.length; i++) {
    
                    const canvasInstance: IIIFComponents.CanvasInstance = this.canvasInstances[i];
                    
                    if (canvasInstance.isVirtual() && canvasInstance.includesVirtualSubCanvas(canvasId)) {
                        return canvasInstance;
                    }
                }

            } else {

                for (let i = 0; i < this.canvasInstances.length; i++) {

                    const canvasInstance: IIIFComponents.CanvasInstance = this.canvasInstances[i];
                    const id: string | undefined = canvasInstance.getCanvasId();

                    if (id) {
                        const canvasInstanceId: string = Manifesto.Utils.normaliseUrl(id);

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

        public playRange(rangeId: string): void {

            if (!this._data.helper) {
                return;
            }

            const range: Manifesto.IRange | null = this._data.helper.getRangeById(rangeId);

            if (range) {
                this.set({
                    range: range
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