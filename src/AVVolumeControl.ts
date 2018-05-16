namespace IIIFComponents {

    export class AVVolumeControl extends _Components.BaseComponent {
        
        private _$volumeSlider: JQuery;
        private _$volumeMute: JQuery;

        private _lastVolume: number = 1;

        private _data: IAVVolumeControlState = {
            volume: 1
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

            this._$volumeSlider = $('<div class="volume-slider"></div>');

            this._$element.append(this._$volumeMute, this._$volumeSlider);

            const that = this;

            this._$volumeMute.on('click', () => {

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
                
                //this._render();
                this.fire(AVVolumeControl.Events.VOLUME_CHANGED, this._data.volume);
            });

            this._$volumeSlider.slider({
                value: that._data.volume,
                step: 0.1,
                orientation: "horizontal",
                min: 0,
                max: 1,
                animate: false,
                create: function (evt: any, ui: any) {
 
                },
                slide: function (evt: any, ui: any) {

                    // start reducer
                    that._data.volume = ui.value;
    
                    if (that._data.volume === 0) {
                        that._lastVolume = 0;
                    }
                    // end reducer
    
                    //that._render();
                    that.fire(AVVolumeControl.Events.VOLUME_CHANGED, that._data.volume);
                    
                },
                stop: function (evt: any, ui: any) {

                }
            });

            return success;
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
                    this._$volumeMute.find('i').switchClass('on', 'off');                
                } else {
                    this._$volumeMute.find('i').switchClass('off', 'on');
                }
            }            
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