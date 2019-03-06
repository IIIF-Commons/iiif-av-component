interface Window {
    MediaSource: any;
    WebKitMediaSource: any;
    jQuery: any;
}

import * as _manifesto from "manifesto.js";

declare global {
    const manifesto: typeof _manifesto;
    const dashjs: any;
    const Hls: any;
    const WaveformData: any;
}
export {};