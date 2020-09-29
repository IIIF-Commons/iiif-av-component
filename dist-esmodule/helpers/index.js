import { canPlayHls } from './can-play-hls';
import { createTimePlansFromManifest } from './create-time-plans-from-manifest';
import { debounce } from './debounce';
import { diffData } from './diff-data';
import { extractMediaFromAnnotationBodies } from './extract-media-from-annotation-bodies';
import { formatTime } from './format-time';
import { getFirstTargetedCanvasId } from './get-first-targeted-canvas-id';
import { getMediaSourceFromAnnotationBody } from './get-media-source-from-annotation-body';
import { getSpatialComponent } from './get-spatial-component';
import { getTimestamp } from './get-timestamp';
import { hlsMimeTypes } from './hls-media-types';
import { isHLSFormat } from './is-hls-format';
import { isIE } from './is-ie';
import { isMpegDashFormat } from './is-mpeg-dash-format';
import { isSafari } from './is-safari';
import { isVirtual } from './is-virtual';
import { normalise } from './normalise-number';
import { retargetTemporalComponent } from './retarget-temporal-component';
export var AVComponentUtils = {
    canPlayHls: canPlayHls,
    createTimePlansFromManifest: createTimePlansFromManifest,
    debounce: debounce,
    diffData: diffData,
    diff: diffData,
    extractMediaFromAnnotationBodies: extractMediaFromAnnotationBodies,
    formatTime: formatTime,
    getFirstTargetedCanvasId: getFirstTargetedCanvasId,
    getMediaSourceFromAnnotationBody: getMediaSourceFromAnnotationBody,
    getSpatialComponent: getSpatialComponent,
    getTimestamp: getTimestamp,
    hlsMimeTypes: hlsMimeTypes,
    hlsMediaTypes: hlsMimeTypes,
    isHLSFormat: isHLSFormat,
    isIE: isIE,
    isMpegDashFormat: isMpegDashFormat,
    isSafari: isSafari,
    isVirtual: isVirtual,
    normalise: normalise,
    normalize: normalise,
    normalizeNumber: normalise,
    normaliseNumber: normalise,
    retargetTemporalComponent: retargetTemporalComponent,
};
//# sourceMappingURL=index.js.map