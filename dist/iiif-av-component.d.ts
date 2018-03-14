// iiif-av-component v0.0.26 https://github.com/iiif-commons/iiif-av-component#readme
interface Array<T> {
    /**
     * Determines whether an array includes a certain element, returning true or false as appropriate.
     * @param searchElement The element to search for.
     * @param fromIndex The position in this array at which to begin searching for searchElement.
     */
    includes(searchElement: T, fromIndex?: number): boolean;
}

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
        private _render();
        private _reset();
        private _getCanvases();
        private _initCanvas(canvas);
        private _prevRange();
        private _nextRage();
        private _getCanvasInstanceById(canvasId);
        private _getCurrentCanvas();
        private _rewind();
        playRange(rangeId: string): void;
        showCanvas(canvasId: string): void;
        private _logMessage(message);
        resize(): void;
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
        static RANGE_CHANGED: string;
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
        private _$canvasContainer;
        private _$canvasDuration;
        private _$canvasHoverHighlight;
        private _$canvasHoverPreview;
        private _$canvasTime;
        private _$canvasTimelineContainer;
        private _$controlsContainer;
        private _$durationHighlight;
        private _$hoverPreviewTemplate;
        private _$nextButton;
        private _$optionsContainer;
        private _$playButton;
        private _$prevButton;
        private _$rangeHoverHighlight;
        private _$rangeHoverPreview;
        private _$rangeTimelineContainer;
        private _$timeDisplay;
        private _$timelineItemContainer;
        private _canvasClockDuration;
        private _canvasClockFrequency;
        private _canvasClockInterval;
        private _canvasClockStartDate;
        private _canvasClockTime;
        private _canvasHeight;
        private _canvasWidth;
        private _contentAnnotations;
        private _data;
        private _highPriorityFrequency;
        private _highPriorityInterval;
        private _isPlaying;
        private _isStalled;
        private _lowPriorityFrequency;
        private _lowPriorityInterval;
        private _readyCanvasesCount;
        private _stallRequestedBy;
        private _volume;
        private _wasPlaying;
        $playerElement: JQuery;
        logMessage: (message: string) => void;
        constructor(options: _Components.IBaseComponentOptions);
        init(): void;
        getCanvasId(): string | null;
        private _updateHoverPreview(e, $container, duration);
        private _previous(isDouble);
        private _next();
        set(data: IAVCanvasInstanceData): void;
        private _render();
        destroy(): void;
        private _convertToPercentage(pixelValue, maxValue);
        private _renderMediaElement(data);
        private _hasRangeChanged();
        private _updateCurrentTimeDisplay();
        private _updateDurationDisplay();
        private _setVolume(value);
        private _renderSyncIndicator(mediaElementData);
        private _setCurrentTime(seconds);
        rewind(withoutUpdate?: boolean): void;
        fastforward(): void;
        play(withoutUpdate?: boolean): void;
        pause(withoutUpdate?: boolean): void;
        private _isNavigationConstrainedToRange();
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
        canvas?: Manifesto.ICanvas;
        currentDuration?: AVComponentObjects.Duration;
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
        canvasId?: string;
        constrainNavigationToRange?: boolean;
        content?: IAVComponentContent;
        defaultAspectRatio?: number;
        doubleClickMS?: number;
        helper?: Manifold.IHelper;
        limitToRange?: boolean;
        rangeId?: string;
    }
}

declare namespace IIIFComponents.AVComponentUtils {
    class Utils {
        private static _compare(a, b);
        static diff(a: any, b: any): string[];
        static formatTime(aNumber: number): string;
    }
}
