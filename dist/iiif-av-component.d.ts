// iiif-av-component v1.1.0 https://github.com/viewdir/iiif-av-component#readme
/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />

declare namespace IIIFComponents {
    class AVComponent extends _Components.BaseComponent {
        options: _Components.IBaseComponentOptions;
        private _canvasInstances;
        constructor(options: _Components.IBaseComponentOptions);
        protected _init(): boolean;
        data(): IAVComponentData;
        set(data: IAVComponentData): void;
        private _reset();
        protected _resize(): void;
    }
}
declare namespace IIIFComponents.AVComponent {
    class Events {
    }
}

declare namespace IIIFComponents {
    interface IAVComponent extends _Components.IBaseComponent {
    }
}

declare namespace IIIFComponents {
    interface IAVComponentContent {
    }
    interface IAVComponentData {
        helper: Manifold.IHelper | null;
    }
}
