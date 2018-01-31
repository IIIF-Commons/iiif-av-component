namespace IIIFComponents {

    export class AVVolumeControl extends _Components.BaseComponent {
        
        private _$volumeSlider: JQuery<HTMLInputElement>;
        private _$volumeMute: JQuery;

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

            this._$volumeMute = $('<button class="volume-mute"><i class="av-icon-mute inactive" aria-hidden="true"></i></button>');
            this._$volumeSlider = $('<input type="range" class="volume-slider" min="0" max="1" step="0.01" value="1">') as JQuery<HTMLInputElement>;

            this._$element.append(this._$volumeMute, this._$volumeSlider);

            const that = this;

            this._$volumeSlider.on('input', function () {
                that.fire(AVVolumeControl.Events.VOLUME_CHANGED, Number(this.value));
            });

            this._$volumeSlider.on('change', function () {
                that.fire(AVVolumeControl.Events.VOLUME_CHANGED, Number(this.value));
            });

            return success;
        }

        protected _resize(): void {

        }
    }

}

namespace IIIFComponents.AVVolumeControl {
    export class Events {
        static VOLUME_CHANGED: string = 'volumechanged';
    }
}