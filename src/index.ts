import { Behavior } from "@iiif/vocabulary";
import { Canvas, Range, Utils } from "manifesto.js";
import { Helper } from "@iiif/manifold";
import { BaseComponent, IBaseComponentOptions } from "@iiif/base-component";
import { CanvasInstance, CanvasInstanceEvents } from "./CanvasInstance";
import { AVComponentUtils } from "./Utils";
import { VirtualCanvas } from "./VirtualCanvas";
import { VolumeEvents } from "./VolumeControl";

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
  fullscreen: string;
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
  helper?: Helper;
  halveAtWidth?: number;
  limitToRange?: boolean;
  posterImageRatio?: number;
  rangeId?: string;
  virtualCanvasEnabled?: boolean;
  waveformBarSpacing?: number;
  waveformBarWidth?: number;
  waveformColor?: string;
}

export class AVComponent extends BaseComponent {
  public options: IBaseComponentOptions;
  public canvasInstances: CanvasInstance[] = [];
  private _$element: JQuery;
  private _data: IAVComponentData = this.data();
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

  constructor(options: IBaseComponentOptions) {
    super(options);

    this._init();
    this._resize();
  }

  protected _init(): boolean {
    super._init();

    this._$element = $(this.el);

    return true;
  }

  public data(): IAVComponentData {
    return <IAVComponentData>{
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
        unmute: "Unmute",
        fullscreen: "Fullscreen"
      }
    };
  }

  public set(data: IAVComponentData): void {
    const oldData: IAVComponentData = Object.assign({}, this._data);
    this._data = Object.assign(this._data, data);
    const diff: string[] = AVComponentUtils.diff(oldData, this._data);

    // changing any of these data properties forces a reload.
    if (diff.includes("helper")) {
      // create canvases
      this._reset();
    }

    if (!this._data.helper) {
      console.warn("must pass a helper object");
      return;
    }

    if (diff.includes("limitToRange") && this._data.canvasId) {
      this.canvasInstances.forEach(
        (canvasInstance: CanvasInstance, index: number) => {
          canvasInstance.set({
            limitToRange: this._data.limitToRange
          });
        }
      );
    }

    if (diff.includes("constrainNavigationToRange") && this._data.canvasId) {
      this.canvasInstances.forEach(
        (canvasInstance: CanvasInstance, index: number) => {
          canvasInstance.set({
            constrainNavigationToRange: this._data.constrainNavigationToRange
          });
        }
      );
    }

    if (diff.includes("autoSelectRange") && this._data.canvasId) {
      this.canvasInstances.forEach(
        (canvasInstance: CanvasInstance, index: number) => {
          canvasInstance.set({
            autoSelectRange: this._data.autoSelectRange
          });
        }
      );
    }

    if (diff.includes("canvasId") && this._data.canvasId) {
      const nextCanvasInstance:
        | CanvasInstance
        | undefined = this._getCanvasInstanceById(this._data.canvasId);

      if (nextCanvasInstance) {
        this.canvasInstances.forEach((canvasInstance: CanvasInstance) => {
          // hide canvases that don't have the same id
          if (
            canvasInstance.getCanvasId() !== nextCanvasInstance.getCanvasId()
          ) {
            canvasInstance.set({
              visible: false
            });
          } else {
            if (diff.includes("range")) {
              canvasInstance.set({
                visible: true,
                range: this._data.range
                  ? jQuery.extend(true, {}, this._data.range)
                  : undefined
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

    if (diff.includes("virtualCanvasEnabled")) {
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

    if (diff.includes("range") && this._data.range) {
      let range: Range | null = this._data.helper.getRangeById(
        this._data.range.id
      );

      if (!range) {
        console.warn("range not found");
      } else {
        let canvasId:
          | string
          | undefined = AVComponentUtils.getFirstTargetedCanvasId(range);

        if (canvasId) {
          // get canvas by normalised id (without temporal part)
          const canvasInstance:
            | CanvasInstance
            | undefined = this._getCanvasInstanceById(canvasId);

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
            if (
              this._data.canvasId &&
              (this._data.canvasId.includes("://")
                ? Utils.normaliseUrl(this._data.canvasId)
                : this._data.canvasId) !== canvasId
            ) {
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

  private _render(): void {}

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

    if (this._data && this._data.helper && this._data.helper.manifest) {
      // if the manifest has an auto-advance behavior, join the canvases into a single "virtual" canvas
      const behavior: Behavior | null = this._data.helper.manifest.getBehavior();
      const canvases: Canvas[] = this._getCanvases();

      if (behavior && behavior.toString() === Behavior.AUTO_ADVANCE) {
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
        this._data.canvasId = <string>this.canvasInstances[0].getCanvasId();
      }

      this._checkAllMediaReadyInterval = setInterval(
        this._checkAllMediaReady.bind(this),
        100
      );
      this._checkAllWaveformsReadyInterval = setInterval(
        this._checkAllWaveformsReady.bind(this),
        100
      );

      this._$posterContainer = $('<div class="poster-container"></div>');
      this._$element.append(this._$posterContainer);

      this._$posterImage = $('<div class="poster-image"></div>');
      this._$posterExpandButton = $(`
                <button class="btn" title="${
                  this._data && this._data.content
                    ? this._data.content.expand
                    : ""
                }">
                    <i class="av-icon  av-icon-expand expand" aria-hidden="true"></i><span>${
                      this._data && this._data.content
                        ? this._data.content.expand
                        : ""
                    }</span>
                </button>
            `);
      this._$posterImage.append(this._$posterExpandButton);

      this._$posterImage.on("touchstart click", e => {
        e.preventDefault();

        const target: any = this._getPosterImageCss(!this._posterImageExpanded);
        //this._$posterImage.animate(target,"fast", "easein");
        this._$posterImage.animate(target);
        this._posterImageExpanded = !this._posterImageExpanded;

        if (this._data.content) {
          if (this._posterImageExpanded) {
            const label: string = this._data.content.collapse;
            this._$posterExpandButton.prop("title", label);
            this._$posterExpandButton
              .find("i")
              .switchClass("expand", "collapse");
          } else {
            const label: string = this._data.content.expand;
            this._$posterExpandButton.prop("title", label);
            this._$posterExpandButton
              .find("i")
              .switchClass("collapse", "expand");
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
            "background-image": "url(" + posterImage + ")"
          });

          this._$posterImage.css(css);
        }
      }
    }
  }

  private _checkAllMediaReady(): void {
    //console.log("loading media");
    if (this._readyMedia === this.canvasInstances.length) {
      //console.log("all media ready");
      clearInterval(this._checkAllMediaReadyInterval);
      //that._logMessage('CREATED CANVAS: ' + canvasInstance.canvasClockDuration + ' seconds, ' + canvasInstance.canvasWidth + ' x ' + canvasInstance.canvasHeight + ' px.');
      this.fire(Events.MEDIA_READY);
      this.resize();
    }
  }

  private _checkAllWaveformsReady(): void {
    //console.log("loading waveforms");
    if (
      this._readyWaveforms === this._getCanvasInstancesWithWaveforms().length
    ) {
      //console.log("waveforms ready");
      clearInterval(this._checkAllWaveformsReadyInterval);
      this.fire(Events.WAVEFORMS_READY);
      this.resize();
    }
  }

  private _getCanvasInstancesWithWaveforms(): CanvasInstance[] {
    return this.canvasInstances.filter(c => {
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
      target: document.createElement("div"),
      data: Object.assign({}, { canvas: canvas }, this._data)
    });

    canvasInstance.logMessage = this._logMessage.bind(this);
    canvasInstance.isOnlyCanvasInstance = this._getCanvases().length === 1;
    this._$element.append(canvasInstance.$playerElement);

    canvasInstance.init();
    this.canvasInstances.push(canvasInstance);

    canvasInstance.on(
      Events.MEDIA_READY,
      () => {
        this._readyMedia++;
      },
      false
    );

    canvasInstance.on(
      Events.WAVEFORM_READY,
      () => {
        this._readyWaveforms++;
      },
      false
    );

    // canvasInstance.on(Events.RESETCANVAS, () => {
    //     this.playCanvas(canvasInstance.canvas.id);
    // }, false);

    canvasInstance.on(
      CanvasInstanceEvents.PREVIOUS_RANGE,
      () => {
        this._prevRange();
      },
      false
    );

    canvasInstance.on(
      CanvasInstanceEvents.NEXT_RANGE,
      () => {
        this._nextRange();
      },
      false
    );

    canvasInstance.on(
      Events.RANGE_CHANGED,
      (rangeId: string | null) => {
        this.fire(Events.RANGE_CHANGED, rangeId);
      },
      false
    );

    canvasInstance.on(
      VolumeEvents.VOLUME_CHANGED,
      (volume: number) => {
        this._setCanvasInstanceVolumes(volume);
        this.fire(VolumeEvents.VOLUME_CHANGED, volume);
      },
      false
    );

    canvasInstance.on(
      CanvasInstanceEvents.PLAYCANVAS, 
      () => {
        this.fire(CanvasInstanceEvents.PLAYCANVAS);
      }, 
      false
    );

    canvasInstance.on(
      CanvasInstanceEvents.PAUSECANVAS, 
      () => {
        this.fire(CanvasInstanceEvents.PAUSECANVAS);
      }, 
      false
    );

    canvasInstance.on(
      Events.MEDIA_ERROR, 
      (error : MediaError) => {
        clearInterval(this._checkAllMediaReadyInterval);
        this.fire(Events.MEDIA_ERROR, error, canvas.id);
      }, 
      false
    );

    canvasInstance.on(
      Events.FULLSCREEN, 
      (state: string) => {
        this.fire(Events.FULLSCREEN, state);
      },
      false
    );
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
    return canvasId.includes("://") ? Utils.normaliseUrl(canvasId) : canvasId;
  }

  private _getCanvasInstanceById(canvasId: string): CanvasInstance | undefined {
    canvasId = this._getNormaliseCanvasId(canvasId);

    // if virtual canvas is enabled, check for that first
    if (this._data.virtualCanvasEnabled) {
      for (let i = 0; i < this.canvasInstances.length; i++) {
        const canvasInstance: CanvasInstance = this.canvasInstances[i];

        let currentCanvasId: string | undefined = canvasInstance.getCanvasId();

        if (currentCanvasId) {
          currentCanvasId = this._getNormaliseCanvasId(currentCanvasId);

          if (
            ((canvasInstance.isVirtual() ||
              this.canvasInstances.length === 1) &&
              currentCanvasId === canvasId) ||
            canvasInstance.includesVirtualSubCanvas(canvasId)
          ) {
            return canvasInstance;
          }
        }
      }
    } else {
      for (let i = 0; i < this.canvasInstances.length; i++) {
        const canvasInstance: CanvasInstance = this.canvasInstances[i];
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

    if (
      currentCanvas &&
      currentCanvas.getCanvasId() === canvasId &&
      !currentCanvas.isVisible()
    ) {
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
    this.fire(Events.LOG, message);
  }

  private _getPosterImageCss(expanded: boolean): any {
    const currentCanvas: CanvasInstance | undefined = this._getCurrentCanvas();

    if (currentCanvas) {
      const $options: JQuery = currentCanvas.$playerElement.find(
        ".options-container"
      );
      const containerWidth: number = <number>(
        currentCanvas.$playerElement.parent().width()
      );
      const containerHeight: number =
        <number>currentCanvas.$playerElement.parent().height() -
        <number>$options.height();

      if (expanded) {
        return {
          top: 0,
          left: 0,
          width: containerWidth,
          height: containerHeight
        };
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
        } else {
          // either height is greater, or width and height are equal
          ratio = this._posterCanvasWidth / this._posterCanvasHeight;
          height = containerHeight * <number>this._data.posterImageRatio;
          width = height * ratio;
        }

        return {
          top: 0,
          left: containerWidth - width,
          width: width,
          height: height
        };
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
      if (this._$posterImage && this._$posterImage.is(":visible")) {
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

export class Events {
  static MEDIA_READY: string = "mediaready";
  static MEDIA_ERROR: string = 'mediaerror';
  static LOG: string = "log";
  static RANGE_CHANGED: string = "rangechanged";
  static WAVEFORM_READY: string = "waveformready";
  static WAVEFORMS_READY: string = "waveformsready";
  static FULLSCREEN: string = 'fullscreen';
}
