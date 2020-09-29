"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var is_hls_format_1 = require("./is-hls-format");
var is_mpeg_dash_format_1 = require("./is-mpeg-dash-format");
var can_play_hls_1 = require("./can-play-hls");
var is_safari_1 = require("./is-safari");
function extractMediaFromAnnotationBodies(annotation) {
    var bodies = annotation.getBody();
    if (!bodies.length) {
        return null;
    }
    // if there's an HLS format and HLS is supported in this browser
    for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        var format = body.getFormat();
        if (format) {
            if (is_hls_format_1.isHLSFormat(format) && can_play_hls_1.canPlayHls()) {
                return body;
            }
        }
    }
    // if there's a Dash format and the browser isn't Safari
    for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        var format = body.getFormat();
        if (format) {
            if (is_mpeg_dash_format_1.isMpegDashFormat(format) && !is_safari_1.isSafari()) {
                return body;
            }
        }
    }
    // otherwise, return the first format that isn't HLS or Dash
    for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i];
        var format = body.getFormat();
        if (format) {
            if (!is_hls_format_1.isHLSFormat(format) && !is_mpeg_dash_format_1.isMpegDashFormat(format)) {
                return body;
            }
        }
    }
    // couldn't find a suitable format
    return null;
}
exports.extractMediaFromAnnotationBodies = extractMediaFromAnnotationBodies;
//# sourceMappingURL=extract-media-from-annotation-bodies.js.map