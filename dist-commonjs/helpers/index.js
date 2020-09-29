"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var can_play_hls_1 = require("./can-play-hls");
var create_time_plans_from_manifest_1 = require("./create-time-plans-from-manifest");
var debounce_1 = require("./debounce");
var diff_data_1 = require("./diff-data");
var extract_media_from_annotation_bodies_1 = require("./extract-media-from-annotation-bodies");
var format_time_1 = require("./format-time");
var get_first_targeted_canvas_id_1 = require("./get-first-targeted-canvas-id");
var get_media_source_from_annotation_body_1 = require("./get-media-source-from-annotation-body");
var get_spatial_component_1 = require("./get-spatial-component");
var get_timestamp_1 = require("./get-timestamp");
var hls_media_types_1 = require("./hls-media-types");
var is_hls_format_1 = require("./is-hls-format");
var is_ie_1 = require("./is-ie");
var is_mpeg_dash_format_1 = require("./is-mpeg-dash-format");
var is_safari_1 = require("./is-safari");
var is_virtual_1 = require("./is-virtual");
var normalise_number_1 = require("./normalise-number");
var retarget_temporal_component_1 = require("./retarget-temporal-component");
exports.AVComponentUtils = {
    canPlayHls: can_play_hls_1.canPlayHls,
    createTimePlansFromManifest: create_time_plans_from_manifest_1.createTimePlansFromManifest,
    debounce: debounce_1.debounce,
    diffData: diff_data_1.diffData,
    diff: diff_data_1.diffData,
    extractMediaFromAnnotationBodies: extract_media_from_annotation_bodies_1.extractMediaFromAnnotationBodies,
    formatTime: format_time_1.formatTime,
    getFirstTargetedCanvasId: get_first_targeted_canvas_id_1.getFirstTargetedCanvasId,
    getMediaSourceFromAnnotationBody: get_media_source_from_annotation_body_1.getMediaSourceFromAnnotationBody,
    getSpatialComponent: get_spatial_component_1.getSpatialComponent,
    getTimestamp: get_timestamp_1.getTimestamp,
    hlsMimeTypes: hls_media_types_1.hlsMimeTypes,
    hlsMediaTypes: hls_media_types_1.hlsMimeTypes,
    isHLSFormat: is_hls_format_1.isHLSFormat,
    isIE: is_ie_1.isIE,
    isMpegDashFormat: is_mpeg_dash_format_1.isMpegDashFormat,
    isSafari: is_safari_1.isSafari,
    isVirtual: is_virtual_1.isVirtual,
    normalise: normalise_number_1.normalise,
    normalize: normalise_number_1.normalise,
    normalizeNumber: normalise_number_1.normalise,
    normaliseNumber: normalise_number_1.normalise,
    retargetTemporalComponent: retarget_temporal_component_1.retargetTemporalComponent,
};
//# sourceMappingURL=index.js.map