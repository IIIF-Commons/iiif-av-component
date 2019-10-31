import { BaseComponent, IBaseComponentOptions } from "@iiif/base-component";

export interface IAVVolumeControlState {
  volume?: number;
}

export class AVVolumeControl extends BaseComponent {
  private _$element: JQuery;
  private _$volumeSlider: JQuery;
  private _$volumeMute: JQuery;

  private _lastVolume: number = 1;

  private _data: IAVVolumeControlState = {
    volume: 1
  };

  constructor(options: IBaseComponentOptions) {
    super(options);

    this._init();
    this._resize();
  }

  protected _init(): boolean {
    super._init();

    this._$element = $(this.el);

    this._$volumeMute = $(`
                            <button class="btn volume-mute" title="${this.options.data.content.mute}">
                                <i class="av-icon av-icon-mute on" aria-hidden="true"></i>${this.options.data.content.mute}
                            </button>`);

    this._$volumeSlider = $('<div class="volume-slider"></div>');

    this._$element.append(this._$volumeMute, this._$volumeSlider);

    const that = this;

    this._$volumeMute.on("touchstart click", e => {
      e.preventDefault();

      // start reducer
      if (this._data.volume !== 0) {
        // mute
        this._lastVolume = <number>this._data.volume;
        this._data.volume = 0;
      } else {
        // unmute
        this._data.volume = this._lastVolume;
      }
      // end reducer

      this.fire(VolumeEvents.VOLUME_CHANGED, this._data.volume);
    });

    this._$volumeSlider.slider({
      value: that._data.volume,
      step: 0.1,
      orientation: "horizontal",
      range: "min",
      min: 0,
      max: 1,
      animate: false,
      create: function(evt: any, ui: any) {},
      slide: function(evt: any, ui: any) {
        // start reducer
        that._data.volume = ui.value;

        if (that._data.volume === 0) {
          that._lastVolume = 0;
        }
        // end reducer

        that.fire(VolumeEvents.VOLUME_CHANGED, that._data.volume);
      },
      stop: function(evt: any, ui: any) {}
    });

    return true;
  }

  public set(data: IAVVolumeControlState): void {
    this._data = Object.assign(this._data, data);

    this._render();
  }

  private _render(): void {
    if (this._data.volume !== undefined) {
      this._$volumeSlider.slider({
        value: this._data.volume
      });

      if (this._data.volume === 0) {
        const label: string = this.options.data.content.unmute;
        this._$volumeMute.prop("title", label);
        this._$volumeMute.find("i").switchClass("on", "off");
      } else {
        const label: string = this.options.data.content.mute;
        this._$volumeMute.prop("title", label);
        this._$volumeMute.find("i").switchClass("off", "on");
      }
    }
  }

  protected _resize(): void {}
}

export class VolumeEvents {
  static VOLUME_CHANGED: string = "volumechanged";
}
