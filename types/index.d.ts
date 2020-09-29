/// <reference types="jquery" />
/// <reference types="jqueryui" />
/// <reference types="webvr-api" />

import { BaseComponent, IBaseComponentOptions } from '@iiif/base-component';
import { Helper } from '@iiif/manifold';
import { MediaType } from '@iiif/vocabulary';
import { Annotation, AnnotationBody, Canvas, Manifest, Range } from 'manifesto.js';

export interface IAVComponentContent {
	currentTime: string;
	collapse: string;
	duration: string;
	expand: string;
	mute: string;
	next: string;
	pause: string;
	play: string;
	previous: string;
	unmute: string;
	fastForward: string;
	fastRewind: string;
}
export interface IAVComponentData {
	[key: string]: any;
	adaptiveAuthEnabled?: boolean;
	autoPlay?: boolean;
	autoSelectRange?: boolean;
	canvasId?: string;
	constrainNavigationToRange?: boolean;
	content?: IAVComponentContent;
	defaultAspectRatio?: number;
	doubleClickMS?: number;
	helper?: Helper;
	halveAtWidth?: number;
	limitToRange?: boolean;
	posterImageRatio?: number;
	rangeId?: string;
	virtualCanvasEnabled?: boolean;
	waveformBarSpacing?: number;
	waveformBarWidth?: number;
	waveformColor?: string;
	enableFastForward?: boolean;
	enableFastRewind?: boolean;
}
declare class VirtualCanvas {
	canvases: Canvas[];
	id: string;
	durationMap: {
		[id: string]: {
			duration: number;
			runningDuration: number;
		};
	};
	totalDuration: number;
	constructor();
	addCanvas(canvas: Canvas): void;
	getContent(): Annotation[];
	getDuration(): number | null;
	getWidth(): number;
	getHeight(): number;
}
export interface IAVCanvasInstanceData extends IAVComponentData {
	canvas?: Canvas | VirtualCanvas;
	range?: Range;
	visible?: boolean;
	volume?: number;
}
export declare type TimeStop = {
	type: 'time-stop';
	canvasIndex: number;
	start: number;
	end: number;
	duration: number;
	rangeId: string;
	rawCanvasSelector: string;
	rangeStack: string[];
	canvasTime: {
		start: number;
		end: number;
	};
};
export declare type TimePlan = {
	type: 'time-plan';
	duration: number;
	start: number;
	end: number;
	stops: TimeStop[];
	rangeId: string;
	canvases: any[];
	rangeStack: string[];
	rangeOrder: string[];
	items: Array<TimeStop | TimePlan>;
};
export declare type MediaOptions = {
	adaptiveAuthEnabled?: boolean;
	mediaSyncMarginSecs?: number;
};
declare abstract class MediaFormat {
	options: MediaOptions;
	source: string;
	protected constructor(source: string, options?: MediaOptions);
	attachTo(element: HTMLMediaElement): void;
}
export interface MediaSource {
	type: string;
	format?: MediaType;
	mediaSource: string;
	canvasId: string;
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	start: number;
	end: number;
	bodyId: string;
	offsetStart?: number;
	offsetEnd?: number;
}
declare class MediaElement {
	type: string;
	format?: string;
	mediaSource: string;
	source: MediaSource;
	element: HTMLMediaElement;
	instance: MediaFormat;
	mediaSyncMarginSecs: number;
	constructor(source: MediaSource, mediaOptions?: MediaOptions);
	syncClock(time: number): void;
	getCanvasId(): string;
	isWithinRange(time: number): boolean;
	load(withAudio?: boolean): Promise<void>;
	setSize(top: number, left: number, width: number, height: number): void;
	isDash(): boolean | "" | undefined;
	isHls(): any;
	isMpeg(): boolean;
	stop(): void;
	play(time?: number): Promise<void>;
	pause(): void;
	isBuffering(): boolean;
}
declare class CompositeMediaElement {
	elements: MediaElement[];
	activeElement: MediaElement;
	playing: boolean;
	canvasMap: {
		[id: string]: MediaElement[];
	};
	private _onPlay;
	private _onPause;
	constructor(mediaElements: MediaElement[]);
	syncClock(time: number): void;
	onPlay(func: (canvasId: string, time: number, el: HTMLMediaElement) => void): void;
	onPause(func: (canvasId: string, time: number, el: HTMLMediaElement) => void): void;
	findElementInRange(canvasId: string, time: number): MediaElement | undefined;
	appendTo($element: JQuery): void;
	load(): Promise<void>;
	seekTo(canvasId: string, time: number): Promise<void>;
	play(canvasId?: string, time?: number): Promise<void>;
	pause(): void;
	setVolume(volume: number): void;
	isBuffering(): boolean;
}
declare class TimePlanPlayer {
	plan: TimePlan;
	fullPlan: TimePlan;
	media: CompositeMediaElement;
	currentStop: TimeStop;
	currentRange: string;
	continuous: boolean;
	playing: boolean;
	_time: number;
	notifyRangeChange: (rangeId: string, stops: {
		from: TimeStop;
		to: TimeStop;
	}) => void;
	notifyTimeChange: (time: number) => void;
	notifyPlaying: (playing: boolean) => void;
	logging: boolean;
	constructor(media: CompositeMediaElement, plan: TimePlan, notifyRangeChange: (rangeId: string, stops: {
		from: TimeStop;
		to: TimeStop;
	}) => void, notifyTimeChange: (time: number) => void, notifyPlaying: (playing: boolean) => void);
	selectPlan({ reset, rangeId }?: {
		reset?: boolean;
		rangeId?: string;
	}): void;
	initialisePlan(plan: TimePlan): void;
	getCurrentRange(): {
		start: number;
		end: number;
		duration: number;
	};
	getTime(): number;
	setInternalTime(time: number): number;
	log(...content: any[]): void;
	setContinuousPlayback(continuous: boolean): void;
	setIsPlaying(playing: boolean): void;
	play(): number;
	currentMediaTime(): number;
	pause(): number;
	setVolume(volume: number): void;
	findStop(time: number): TimeStop | undefined;
	setTime(time: number, setRange?: boolean): Promise<void>;
	next(): number;
	previous(): number;
	setRange(id: string): number;
	isBuffering(): boolean;
	advanceToTime(time: number): {
		buffering: boolean;
		time: number;
		paused?: undefined;
	} | {
		paused: boolean;
		buffering: boolean;
		time: number;
	} | {
		time: number;
		buffering?: undefined;
		paused?: undefined;
	};
	hasEnded(): boolean;
	advanceToStop(from: TimeStop, to: TimeStop, rangeId?: string): Promise<void>;
	getStartTime(): number;
	getDuration(): number;
}
export declare class CanvasInstance extends BaseComponent {
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
	private _$fastForward;
	private _$fastRewind;
	private _$optionsContainer;
	private _$playButton;
	private _$prevButton;
	private _$rangeHoverHighlight;
	private _$rangeHoverPreview;
	private _$rangeTimelineContainer;
	private _$timeDisplay;
	private _$timelineItemContainer;
	private _canvasClockFrequency;
	private _canvasClockInterval;
	private _canvasClockStartDate;
	private _canvasClockTime;
	private _canvasHeight;
	private _canvasWidth;
	private _compositeWaveform;
	private _contentAnnotations;
	private _data;
	private _highPriorityFrequency;
	private _highPriorityInterval;
	private _isPlaying;
	private _isStalled;
	private _lowPriorityFrequency;
	private _lowPriorityInterval;
	private _mediaSyncMarginSecs;
	private _rangeSpanPadding;
	private _readyMediaCount;
	private _stallRequestedBy;
	private _volume;
	private _wasPlaying;
	private _waveformCanvas;
	private _waveformCtx;
	ranges: Range[];
	waveforms: string[];
	private _buffering;
	private _bufferShown;
	$playerElement: JQuery;
	_$element: JQuery;
	isOnlyCanvasInstance: boolean;
	logMessage: (message: string) => void;
	timePlanPlayer: TimePlanPlayer;
	constructor(options: IBaseComponentOptions);
	loaded(): void;
	isPlaying(): boolean;
	getClockTime(): number;
	createTimeStops(): void;
	init(): void;
	private _getBody;
	private _getDuration;
	data(): IAVCanvasInstanceData;
	/**
	 * @deprecated
	 */
	isVirtual(): boolean;
	isVisible(): boolean;
	includesVirtualSubCanvas(canvasId: string): boolean;
	setVisibility(visibility: boolean): void;
	viewRange(rangeId: string): void;
	limitToRange: boolean;
	currentRange?: string;
	setCurrentRangeId(range: null | string, { autoChanged, limitToRange }?: {
		autoChanged?: boolean;
		limitToRange?: boolean;
	}): void;
	setVolume(volume: number): void;
	setLimitToRange(limitToRange: boolean): void;
	set(data: IAVCanvasInstanceData): void;
	private _hasRangeChanged;
	private _getRangeForCurrentTime;
	private _rangeSpansCurrentTime;
	private _rangeNavigable;
	private _render;
	getCanvasId(): string | undefined;
	private _updateHoverPreview;
	private _previous;
	private _next;
	destroy(): void;
	private _convertToPercentage;
	private _renderMediaElement;
	private _getWaveformData;
	private waveformDeltaX;
	private waveformPageX;
	private waveFormInit;
	private _renderWaveform;
	private getRangeTiming;
	private _drawWaveform;
	private _scaleY;
	private _getWaveformMaxAndMin;
	isLimitedToRange(): boolean | undefined;
	hasCurrentRange(): boolean;
	private _updateCurrentTimeDisplay;
	private _updateDurationDisplay;
	private _renderSyncIndicator;
	setCurrentTime(seconds: number): Promise<void>;
	private _setCurrentTime;
	private _rewind;
	private _fastforward;
	play(withoutUpdate?: boolean): Promise<void>;
	pause(withoutUpdate?: boolean): void;
	private _isNavigationConstrainedToRange;
	private _canvasClockUpdater;
	private _highPriorityUpdater;
	private _lowPriorityUpdater;
	private _updateMediaActiveStates;
	private _pauseMedia;
	private _setMediaCurrentTime;
	private _synchronizeMedia;
	private _checkMediaSynchronization;
	private _playbackStalled;
	resize(): void;
}
export declare class AVComponent extends BaseComponent {
	static newRanges: boolean;
	private _data;
	options: IBaseComponentOptions;
	canvasInstances: CanvasInstance[];
	private _checkAllMediaReadyInterval;
	private _checkAllWaveformsReadyInterval;
	private _readyMedia;
	private _readyWaveforms;
	private _posterCanvasWidth;
	private _posterCanvasHeight;
	private _$posterContainer;
	private _$posterImage;
	private _$posterExpandButton;
	private _$element;
	private _posterImageExpanded;
	constructor(options: IBaseComponentOptions);
	protected _init(): boolean;
	getCurrentCanvasInstance(): Canvas | null;
	data(): IAVComponentData;
	set(data: IAVComponentData): void;
	private _render;
	reset(): void;
	private _reset;
	setCurrentTime(time: number): Promise<void>;
	getCurrentTime(): number;
	isPlaying(): boolean;
	private _checkAllMediaReady;
	private _checkAllWaveformsReady;
	private _getCanvasInstancesWithWaveforms;
	private _getCanvases;
	private _initCanvas;
	getCurrentRange(): Range | null;
	private _prevRange;
	private _nextRange;
	private _setCanvasInstanceVolumes;
	private _getNormaliseCanvasId;
	private _getCanvasInstanceById;
	private _getCurrentCanvas;
	private _rewind;
	play(): void;
	viewRange(rangeId: string): void;
	pause(): void;
	playRange(rangeId: string, autoChanged?: boolean): void;
	showCanvas(canvasId: string): void;
	private _logMessage;
	private _getPosterImageCss;
	resize(): void;
}
export interface IAVVolumeControlState {
	volume?: number;
}
export declare class AVVolumeControl extends BaseComponent {
	private _$volumeSlider;
	private _$volumeMute;
	private _lastVolume;
	private _$element;
	private _data;
	constructor(options: IBaseComponentOptions);
	protected _init(): boolean;
	set(data: IAVVolumeControlState): void;
	private _render;
	protected _resize(): void;
}
declare function canPlayHls(): boolean;
declare function createTimePlansFromManifest(manifest: Manifest, mediaElements: MediaElement[]): TimePlan;
declare function debounce(fn: any, debounceDuration: number): any;
declare function diffData(a: any, b: any): string[];
declare function extractMediaFromAnnotationBodies(annotation: Annotation): AnnotationBody | null;
declare function formatTime(aNumber: number): string;
declare function getFirstTargetedCanvasId(range: Range): string | undefined;
declare function getMediaSourceFromAnnotationBody(annotation: Annotation, body: AnnotationBody, canvasDimensions: {
	id: string;
	width: number;
	height: number;
	duration: number;
}): MediaSource;
declare function getSpatialComponent(target: string): number[] | null;
declare function getTimestamp(): string;
declare function isHLSFormat(format: MediaType): boolean;
declare function isIE(): number | boolean;
declare function isMpegDashFormat(format: MediaType): boolean;
declare function isSafari(): boolean;
declare function isVirtual(canvas: Canvas | VirtualCanvas | undefined): canvas is VirtualCanvas;
declare function normalise(num: number, min: number, max: number): number;
declare function retargetTemporalComponent(canvases: Canvas[], target: string): string | undefined;
export declare const AVComponentUtils: {
	canPlayHls: typeof canPlayHls;
	createTimePlansFromManifest: typeof createTimePlansFromManifest;
	debounce: typeof debounce;
	diffData: typeof diffData;
	diff: typeof diffData;
	extractMediaFromAnnotationBodies: typeof extractMediaFromAnnotationBodies;
	formatTime: typeof formatTime;
	getFirstTargetedCanvasId: typeof getFirstTargetedCanvasId;
	getMediaSourceFromAnnotationBody: typeof getMediaSourceFromAnnotationBody;
	getSpatialComponent: typeof getSpatialComponent;
	getTimestamp: typeof getTimestamp;
	hlsMimeTypes: string[];
	hlsMediaTypes: string[];
	isHLSFormat: typeof isHLSFormat;
	isIE: typeof isIE;
	isMpegDashFormat: typeof isMpegDashFormat;
	isSafari: typeof isSafari;
	isVirtual: typeof isVirtual;
	normalise: typeof normalise;
	normalize: typeof normalise;
	normalizeNumber: typeof normalise;
	normaliseNumber: typeof normalise;
	retargetTemporalComponent: typeof retargetTemporalComponent;
};
export declare class Events {
	static PLAY: string;
	static PAUSE: string;
	static MEDIA_READY: string;
	static LOG: string;
	static RANGE_CHANGED: string;
	static WAVEFORM_READY: string;
	static WAVEFORMS_READY: string;
}
export declare class CanvasInstanceEvents {
	static NEXT_RANGE: string;
	static PAUSECANVAS: string;
	static PLAYCANVAS: string;
	static PREVIOUS_RANGE: string;
}
export declare class VolumeEvents {
	static VOLUME_CHANGED: string;
}

export as namespace IIIFAVComponent;
