// iiif-av-component v0.0.13 https://github.com/iiif-commons/iiif-av-component#readme

/// <reference types="base-component" />
declare namespace IIIFComponents {
    class AVComponent extends _Components.BaseComponent {
        private _data;
        options: _Components.IBaseComponentOptions;
        canvasInstances: CanvasInstance[];
        constructor(options: _Components.IBaseComponentOptions);
        protected _init(): boolean;
        data(): IAVComponentData;
        set(data: IAVComponentData): void;
        private _propertiesChanged(data, properties);
        private _propertyChanged(data, propertyName);
        private _reset();
        private _update();
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
        private _$canvasContainer;
        private _$canvasDuration;
        private _$canvasTime;
        private _$controlsContainer;
        private _$durationHighlight;
        private _$optionsContainer;
        private _$playButton;
        private _$rangeTimelineContainer;
        private _$timelineContainer;
        private _$timelineItemContainer;
        private _$timingControls;
        private _$volumeControl;
        private _canvasClockFrequency;
        private _canvasHeight;
        private _canvasWidth;
        private _contentAnnotations;
        private _data;
        private _e;
        $playerElement: JQuery;
        canvas: Manifesto.ICanvas;
        canvasClockDuration: number;
        canvasClockInterval: number;
        canvasClockStartDate: number;
        canvasClockTime: number;
        currentDuration: AVComponentObjects.Duration | null;
        highPriorityInterval: number;
        isPlaying: boolean;
        isStalled: boolean;
        logMessage: (message: string) => void;
        lowPriorityInterval: number;
        readyCanvasesCount: number;
        stallRequestedBy: any[];
        wasPlaying: boolean;
        constructor(canvas: Manifesto.ICanvas, data: IAVComponentData);
        init(): void;
        limitToRange(limit: boolean): void;
        private _convertToPercentage(pixelValue, maxValue);
        private _renderMediaElement(data);
        highlightDuration(): void;
        setVolume(value: number): void;
        private _renderSyncIndicator(mediaElementData);
        setCurrentTime(seconds: number): void;
        play(withoutUpdate?: boolean): void;
        pause(withoutUpdate?: boolean): void;
        canvasClockUpdater(): void;
        highPriorityUpdater(): void;
        lowPriorityUpdater(): void;
        updateMediaActiveStates(): void;
        synchronizeMedia(): void;
        checkMediaSynchronization(): void;
        playbackStalled(aBoolean: boolean, syncMediaRequestingStall: any): void;
        private _showWorkingIndicator($targetElement);
        private _hideWorkingIndicator();
        resize(): void;
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
        limitToRange: boolean;
        [key: string]: any;
    }
}

declare namespace IIIFComponents.AVComponentUtils {
    class Utils {
        static formatTime(aNumber: number): string;
    }
}
