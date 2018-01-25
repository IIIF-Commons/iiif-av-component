// iiif-av-component v0.0.16 https://github.com/iiif-commons/iiif-av-component#readme

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
        private _prevRange();
        private _nextRage();
        getCanvasInstanceById(canvasId: string): CanvasInstance | null;
        playCanvas(canvasId: string): void;
        playRange(rangeId: string): void;
        showCanvas(canvasId: string): void;
        private _logMessage(message);
        resize(): void;
        protected _resize(): void;
    }
}
declare namespace IIIFComponents.AVComponent {
    class Events {
        static CANVASREADY: string;
        static LOG: string;
        static NEXT: string;
        static PAUSECANVAS: string;
        static PLAYCANVAS: string;
        static PREVIOUS: string;
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
        private _$canvasTimelineContainer;
        private _$controlsContainer;
        private _$durationHighlight;
        private _$nextButton;
        private _$optionsContainer;
        private _$playButton;
        private _$prevButton;
        private _$rangeTimelineContainer;
        private _$timelineItemContainer;
        private _$timingControls;
        private _$volumeControl;
        private _canvasClockDuration;
        private _canvasClockFrequency;
        private _canvasClockInterval;
        private _canvasClockStartDate;
        private _canvasClockTime;
        private _canvasHeight;
        private _canvasWidth;
        private _contentAnnotations;
        private _data;
        private _e;
        private _highPriorityInterval;
        private _isPlaying;
        private _isStalled;
        private _lowPriorityInterval;
        private _readyCanvasesCount;
        private _stallRequestedBy;
        private _wasPlaying;
        $playerElement: JQuery;
        canvas: Manifesto.ICanvas;
        currentDuration: AVComponentObjects.Duration | null;
        logMessage: (message: string) => void;
        constructor(canvas: Manifesto.ICanvas, data: IAVComponentData);
        init(): void;
        private _previous(isDouble);
        set(data?: IAVComponentData): void;
        destroy(): void;
        private _convertToPercentage(pixelValue, maxValue);
        private _renderMediaElement(data);
        private _updateCurrentTimeDisplay();
        private _updateDurationDisplay();
        highlightDuration(): void;
        setVolume(value: number): void;
        private _renderSyncIndicator(mediaElementData);
        setCurrentTime(seconds: number): void;
        rewind(withoutUpdate?: boolean): void;
        play(withoutUpdate?: boolean): void;
        pause(withoutUpdate?: boolean): void;
        private _isLimitedToRange();
        private _canvasClockUpdater();
        private _highPriorityUpdater();
        private _lowPriorityUpdater();
        private _updateMediaActiveStates();
        private _synchronizeMedia();
        private _checkMediaSynchronization();
        private _playbackStalled(aBoolean, syncMediaRequestingStall);
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
        getLength(): number;
    }
}

declare namespace IIIFComponents {
    interface IAVComponent extends _Components.IBaseComponent {
    }
}

/// <reference types="@iiif/manifold" />
declare namespace IIIFComponents {
    interface IAVComponentContent {
        currentTime: string;
        duration: string;
        next: string;
        pause: string;
        play: string;
        previous: string;
    }
    interface IAVComponentData {
        [key: string]: any;
        autoPlay?: boolean;
        content?: IAVComponentContent;
        defaultAspectRatio?: number;
        doubleClickMS: number;
        helper?: Manifold.IHelper;
        limitToRange?: boolean;
    }
}

declare namespace IIIFComponents.AVComponentUtils {
    class Utils {
        static formatTime(aNumber: number): string;
    }
}
