// iiif-av-component v0.0.1 https://github.com/iiif-commons/iiif-av-component#readme
/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />

/// <reference types="base-component" />
declare namespace IIIFComponents {
    class AVComponent extends _Components.BaseComponent {
        options: _Components.IBaseComponentOptions;
        canvasInstances: CanvasInstance[];
        constructor(options: _Components.IBaseComponentOptions);
        protected _init(): boolean;
        data(): IAVComponentData;
        set(data: IAVComponentData): void;
        private _reset();
        private _render();
        private _getCanvases();
        private _initCanvas(canvas);
        getCanvasInstanceById(canvasId: string): CanvasInstance | null;
        playCanvas(canvasId: string): void;
        showCanvas(canvasId: string): void;
        private _logMessage(message);
        resize(): void;
        protected _resize(): void;
    }
}
declare namespace IIIFComponents.AVComponent {
    class Events {
        static LOG: string;
    }
}

/// <reference types="jquery" />
/// <reference types="jqueryui" />
/// <reference types="manifesto.js" />
declare namespace IIIFComponents {
    class CanvasInstance {
        private _highPriorityFrequency;
        private _lowPriorityFrequency;
        private _canvasClockFrequency;
        canvasClockInterval: number;
        highPriorityInterval: number;
        lowPriorityInterval: number;
        private _mediaElements;
        $playerElement: JQuery | null;
        canvasClockDuration: number;
        canvasClockStartDate: number;
        canvasClockTime: number;
        canvasHeight: number;
        canvasWidth: number;
        data: Manifesto.ICanvas | null;
        isPlaying: boolean;
        isStalled: boolean;
        logMessage: (message: string) => void;
        stallRequestedBy: any[];
        wasPlaying: boolean;
        constructor(canvas: Manifesto.ICanvas);
        initContents(): void;
        private _convertToPercentage(pixelValue, maxValue);
        private _renderMediaElement(data);
        private _renderSyncIndicator(mediaElementData);
        setCurrentTime(seconds: string | number): void;
        playCanvas(withoutUpdate?: boolean): void;
        pauseCanvas(withoutUpdate?: boolean): void;
        canvasClockUpdater(): void;
        highPriorityUpdater(): void;
        lowPriorityUpdater(): void;
        updateMediaActiveStates(): void;
        synchronizeMedia(): void;
        checkMediaSynchronization(): void;
        playbackStalled(aBoolean: boolean, syncMediaRequestingStall: any): void;
        private _showWorkingIndicator($targetElement);
        private _hideWorkingIndicator();
    }
}

declare namespace IIIFComponents {
    interface IAVComponent extends _Components.IBaseComponent {
    }
}

/// <reference types="manifold" />
declare namespace IIIFComponents {
    interface IAVComponentContent {
    }
    interface IAVComponentData {
        helper: Manifold.IHelper | null;
        defaultAspectRatio: number;
    }
}

declare namespace IIIFComponents.AVComponentUtils {
    class Utils {
        static formatTime(aNumber: number): string;
    }
}
