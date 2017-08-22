namespace IIIFComponents {

    export class AVComponent extends _Components.BaseComponent {

        public options: _Components.IBaseComponentOptions;

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

            this._$element.empty();
            this._$element.append('test');

            return success;
        }

        public data(): IAVComponentData {
            return <IAVComponentData> {
                helper: null
            }
        }

        protected _resize(): void {

        }
    }
}

namespace IIIFComponents.AVComponent {
    export class Events {
        static EXPLORER_NODE_SELECTED: string = 'explorerNodeSelected';
    }
}

(function(g:any) {
    if (!g.IIIFComponents){
        g.IIIFComponents = IIIFComponents;
    } else {
        g.IIIFComponents.AVComponent = IIIFComponents.AVComponent;
    }
})(global);