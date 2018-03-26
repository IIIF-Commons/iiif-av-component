namespace IIIFComponents {

    export class AVVolumeControl extends _Components.BaseComponent {
        
        private _$volumeSlider: JQuery<HTMLInputElement>;
        private _$volumeMute: JQuery;

        private _state: AVVolumeControlState = {
            currentVolume: 1,
            lastVolume: 1
        };

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

            this._$volumeMute = $(`
                                <button class="btn volume-mute" title="${this.options.data.content.mute}">
                                    <i class="av-icon-mute on" aria-hidden="true"></i>${this.options.data.content.mute}
                                </button>`);
            this._$volumeSlider = $('<input type="range" class="volume-slider" min="0" max="1" step="0.01" value="1">') as JQuery<HTMLInputElement>;

            this._$element.append(this._$volumeMute, this._$volumeSlider);

            const that = this;

            this._$volumeMute.on('click', () => {

                // start reducer
                if (this._state.currentVolume !== 0) {
                    // mute
                    this._state.lastVolume = this._state.currentVolume;
                    this._state.currentVolume = 0;
                } else {
                    // unmute
                    this._state.currentVolume = this._state.lastVolume;
                }
                // end reducer
                
                this._render();

                this.fire(AVVolumeControl.Events.VOLUME_CHANGED, this._state.currentVolume);
            });

            this._$volumeSlider.on('input', function () {

                // start reducer
                that._state.currentVolume = Number(this.value);

                if (that._state.currentVolume === 0) {
                    that._state.lastVolume = 0;
                }
                // end reducer

                that._render();
                that.fire(AVVolumeControl.Events.VOLUME_CHANGED, that._state.currentVolume);
            });

            this._$volumeSlider.on('change', function () {

                // start reducer
                that._state.currentVolume = Number(this.value);

                if (that._state.currentVolume === 0) {
                    that._state.lastVolume = 0;
                }
                // end reducer
                
                that._render();
                that.fire(AVVolumeControl.Events.VOLUME_CHANGED, that._state.currentVolume);
            });

            return success;
        }

        private _render(): void {

            this._$volumeSlider.val(this._state.currentVolume);

            if (this._state.currentVolume === 0) {
                this._$volumeMute.find('i').switchClass('on', 'off');                
            } else {
                this._$volumeMute.find('i').switchClass('off', 'on');
            }
        }

        protected _resize(): void {

        }
    }

    interface AVVolumeControlState {
        currentVolume: number;
        lastVolume: number;
    }

}

namespace IIIFComponents.AVVolumeControl {
    export class Events {
        static VOLUME_CHANGED: string = 'volumechanged';
    }
}