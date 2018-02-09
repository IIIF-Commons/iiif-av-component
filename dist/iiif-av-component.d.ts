// iiif-av-component v0.0.24 https://github.com/iiif-commons/iiif-av-component#readme

/// <reference types="base-component" />
declare namespace IIIFComponents {
    class AVComponent extends _Components.BaseComponent {
        private _currentCanvas;
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
        private _getCurrentCanvas();
        private _rewind();
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
        static NEXT_RANGE: string;
        static NO_RANGE: string;
        static PAUSECANVAS: string;
        static PLAYCANVAS: string;
        static PREVIOUS_RANGE: string;
    }
}

/// <reference types="base-component" />
declare namespace IIIFComponents {
    class AVVolumeControl extends _Components.BaseComponent {
        private _$volumeSlider;
        private _$volumeMute;
        private _state;
        constructor(options: _Components.IBaseComponentOptions);
        protected _init(): boolean;
        private _render();
        protected _resize(): void;
    }
}
declare namespace IIIFComponents.AVVolumeControl {
    class Events {
        static VOLUME_CHANGED: string;
    }
}

/// <reference types="base-component" />
/// <reference types="jquery" />
/// <reference types="jqueryui" />
declare namespace IIIFComponents {
    class CanvasInstance extends _Components.BaseComponent {
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
        private _$timeDisplay;
        private _canvasClockDuration;
        private _canvasClockFrequency;
        private _canvasClockInterval;
        private _canvasClockStartDate;
        private _canvasClockTime;
        private _canvasHeight;
        private _canvasWidth;
        private _contentAnnotations;
        private _highPriorityInterval;
        private _isPlaying;
        private _isStalled;
        private _lowPriorityInterval;
        private _readyCanvasesCount;
        private _stallRequestedBy;
        private _wasPlaying;
        private _volume;
        $playerElement: JQuery;
        currentDuration: AVComponentObjects.Duration | null;
        logMessage: (message: string) => void;
        constructor(options: _Components.IBaseComponentOptions);
        init(): void;
        getCanvasId(): string | null;
        private _previous(isDouble);
        private _next();
        set(data: IAVCanvasInstanceData): void;
        destroy(): void;
        private _convertToPercentage(pixelValue, maxValue);
        private _renderMediaElement(data);
        private _updateCurrentTimeDisplay();
        private _updateDurationDisplay();
        unhighlightDuration(): void;
        highlightDuration(): void;
        setVolume(value: number): void;
        private _renderSyncIndicator(mediaElementData);
        setCurrentTime(seconds: number): void;
        rewind(withoutUpdate?: boolean): void;
        fastforward(): void;
        play(withoutUpdate?: boolean): void;
        pause(withoutUpdate?: boolean): void;
        private _isNavigationConstrainedToRange();
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

/// <reference types="manifesto.js" />
declare namespace IIIFComponents {
    interface IAVCanvasInstanceData extends IAVComponentData {
        canvas: Manifesto.ICanvas;
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
        mute: string;
        next: string;
        pause: string;
        play: string;
        previous: string;
    }
    interface IAVComponentData {
        [key: string]: any;
        autoPlay?: boolean;
        constrainNavigationToRange?: boolean;
        content?: IAVComponentContent;
        defaultAspectRatio?: number;
        doubleClickMS?: number;
        helper?: Manifold.IHelper;
        limitToRange?: boolean;
    }
}

declare namespace IIIFComponents.AVComponentUtils {
    class Utils {
        static formatTime(aNumber: number): string;
    }
}
