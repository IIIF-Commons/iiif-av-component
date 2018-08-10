namespace IIIFComponents {

    export class AVComponent extends _Components.BaseComponent {

        private _data: IAVComponentData = this.data();
        public options: _Components.IBaseComponentOptions;
        public canvasInstances: CanvasInstance[] = [];
        private _checkAllCanvasesReadyInterval: any;
        private _readyCanvases: number = 0;
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
                limitToRange: false,
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

                this._checkAllCanvasesReadyInterval = setInterval(this._checkAllCanvasesReady.bind(this), 100);

                this._$posterContainer = $('<div class="poster-container"></div>');
                this._$element.append(this._$posterContainer);

                this._$posterImage = $('<div class="poster-image"></div>');
                this._$posterExpandButton = $(`
                    <button class="btn" title="${this._data && this._data.content ? this._data.content.expand : ''}">
                        <i class="av-icon  av-icon-expand expand" aria-hidden="true"></i><span>${this._data && this._data.content ? this._data.content.expand : ''}</span>
                    </button>
                `);
                this._$posterImage.append(this._$posterExpandButton);

                this._$posterImage.on('touchstart click', () => {                    
                    const target: any = this._getPosterImageCss(!this._posterImageExpanded);
                    //this._$posterImage.animate(target,"fast", "easein");
                    this._$posterImage.animate(target);
                    this._posterImageExpanded = !this._posterImageExpanded;

                    if (this._posterImageExpanded) {
                        const label: string = this.options.data.content.collapse;
                        this._$posterExpandButton.prop('title', label);
                        this._$posterExpandButton.find('i').switchClass('expand', 'collapse');
                    } else {
                        const label: string = this.options.data.content.expand;
                        this._$posterExpandButton.prop('title', label);
                        this._$posterExpandButton.find('i').switchClass('collapse', 'expand');
                    }
                    
                });

                // poster canvas
                const posterCanvas: Manifesto.ICanvas | null = this._data.helper.getPosterCanvas();

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

        private _checkAllCanvasesReady(): void {
            console.log('loading media');
            if (this._readyCanvases === this.canvasInstances.length) {
                console.log('media ready');
                clearInterval(this._checkAllCanvasesReadyInterval);
                //that._logMessage('CREATED CANVAS: ' + canvasInstance.canvasClockDuration + ' seconds, ' + canvasInstance.canvasWidth + ' x ' + canvasInstance.canvasHeight + ' px.');
                this.fire(AVComponent.Events.CANVASREADY);
                this.resize();
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
                this._readyCanvases++;
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
                    
                    if (canvasInstance.isVirtual() && canvasInstance.getCanvasId() === canvasId || canvasInstance.includesVirtualSubCanvas(canvasId)) {
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

            const range: Manifesto.IRange | null = this._data.helper.getRangeById(rangeId);

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

                    // get the longer edge of the poster canvas and make that a third of the container height/width.
                    // scale the shorter edge proportionally.
                    let ratio: number;
                    let width: number;
                    let height: number;

                    if (this._posterCanvasWidth > this._posterCanvasHeight) {
                        ratio = this._posterCanvasHeight / this._posterCanvasWidth;
                        width = containerWidth / 3;
                        height = width * ratio;
                    } else { // either height is greater, or width and height are equal
                        ratio = this._posterCanvasWidth / this._posterCanvasHeight;
                        height = containerHeight / 3;
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