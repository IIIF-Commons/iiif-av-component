// iiif-av-component v0.0.10 https://github.com/iiif-commons/iiif-av-component#readme

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
        play(canvasId: string): void;
        showCanvas(canvasId: string): void;
        private _logMessage(message);
        resize(): void;
        protected _resize(): void;
    }
}
declare namespace IIIFComponents.AVComponent {
    class Events {
        static CANVASREADY: string;
        static PLAYCANVAS: string;
        static PAUSECANVAS: string;
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
        private _e;
        canvasClockInterval: number;
        highPriorityInterval: number;
        lowPriorityInterval: number;
        private _mediaElements;
        $playerElement: JQuery;
        canvasClockDuration: number;
        canvasClockStartDate: number;
        canvasClockTime: number;
        canvasHeight: number;
        canvasWidth: number;
        currentDuration: AVComponentObjects.Duration | null;
        data: Manifesto.ICanvas | null;
        isPlaying: boolean;
        isStalled: boolean;
        logMessage: (message: string) => void;
        readyCanvasesCount: number;
        stallRequestedBy: any[];
        wasPlaying: boolean;
        constructor(canvas: Manifesto.ICanvas);
        initContents(): void;
        private _convertToPercentage(pixelValue, maxValue);
        private _renderMediaElement(data);
        private _getDurationHighlight();
        highlightDuration(): void;
        setVolume(value: number): void;
        private _renderSyncIndicator(mediaElementData);
        setCurrentTime(seconds: number): void;
        play(withoutUpdate?: boolean): void;
        pause(withoutUpdate?: boolean): void;
        canvasClockUpdater(): void;
        private _getTimelineContainer();
        highPriorityUpdater(): void;
        lowPriorityUpdater(): void;
        updateMediaActiveStates(): void;
        synchronizeMedia(): void;
        checkMediaSynchronization(): void;
        playbackStalled(aBoolean: boolean, syncMediaRequestingStall: any): void;
        private _showWorkingIndicator($targetElement);
        private _hideWorkingIndicator();
        on(name: string, callback: Function, ctx: any): void;
        fire(name: string, ...args: any[]): void;
    }
}

declare namespace IIIFComponents.AVComponentObjects {
    class Duration {
        start: number;
        end: number;
        constructor(start: number, end: number);
    }
}

declare namespace IIIFComponents {
    interface IAVComponent extends _Components.IBaseComponent {
    }
}

/// <reference types="manifold" />
declare namespace IIIFComponents {
    interface IAVComponentContent {
        play: string;
        pause: string;
        currentTime: string;
        duration: string;
    }
    interface IAVComponentData {
        helper: Manifold.IHelper | null;
        autoPlay: boolean;
        defaultAspectRatio: number;
        content: IAVComponentContent;
    }
}

declare namespace IIIFComponents.AVComponentUtils {
    class Utils {
        static formatTime(aNumber: number): string;
    }
}
