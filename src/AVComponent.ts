namespace IIIFComponents {

    export class AVComponent extends _Components.BaseComponent {

        public options: _Components.IBaseComponentOptions;

        //private _$rangeNavigationContainer: JQuery;

        private _canvasInstances: any[] = [];

        constructor(options: _Components.IBaseComponentOptions) {
            super(options);

            this._init();
            this._resize();
        }

        protected _init(): boolean {
            var success: boolean = super._init();

            if (!success) {
                console.error("Component failed to initialise");
            }

            this._reload();

            return success;
        }

        public data(): IAVComponentData {
            return <IAVComponentData> {
                helper: null
            }
        }

        public set(data: IAVComponentData): void {
            this._reload();
        }

        private _reload(): void {

            for (let i = 0; i < this._canvasInstances.length; i++) {
                window.clearInterval(this._canvasInstances[i].highPriorityInterval);
                window.clearInterval(this._canvasInstances[i].lowPriorityInterval);
                window.clearInterval(this._canvasInstances[i].canvasClockInterval);
            }

            this._canvasInstances = [];

            this._$element.empty();
        }

        protected _resize(): void {

        }
    }
}

namespace IIIFComponents.AVComponent {
    export class Events {
        
    }
}

(function(g:any) {
    if (!g.IIIFComponents){
        g.IIIFComponents = IIIFComponents;
    } else {
        g.IIIFComponents.AVComponent = IIIFComponents.AVComponent;
    }
})(global);