// iiif-av-component v0.0.1 https://github.com/viewdir/iiif-av-component#readme
/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />

declare namespace IIIFComponents {
    class AVComponent extends _Components.BaseComponent {
        options: _Components.IBaseComponentOptions;
        canvasInstances: any[];
        constructor(options: _Components.IBaseComponentOptions);
        protected _init(): boolean;
        data(): IAVComponentData;
        set(data: IAVComponentData): void;
        private _reset();
        private _render();
        private _getCanvases();
        private _initCanvas(canvas);
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
declare namespace IIIFComponents {
    class CanvasInstance {
        private _highPriorityFrequency;
        private _lowPriorityFrequency;
        private _canvasClockFrequency;
        private _canvasClockInterval;
        private _highPriorityInterval;
        private _lowPriorityInterval;
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

declare namespace IIIFComponents {
    interface IAVComponentContent {
    }
    interface IAVComponentData {
        helper: Manifold.IHelper | null;
        defaultCanvasHeight: number;
        defaultCanvasWidth: number;
    }
}

declare namespace IIIFComponents.AVComponentUtils {
    class Utils {
        static formatTime(aNumber: number): string;
    }
}
