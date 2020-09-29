import { Utils } from 'manifesto.js';
export function retargetTemporalComponent(canvases, target) {
    var t = Utils.getTemporalComponent(target);
    if (t) {
        var offset = 0;
        var targetWithoutTemporal = target.substr(0, target.indexOf('#'));
        // loop through canvases adding up their durations until we reach the targeted canvas
        for (var i = 0; i < canvases.length; i++) {
            var canvas = canvases[i];
            if (!canvas.id.includes(targetWithoutTemporal)) {
                var duration = canvas.getDuration();
                if (duration) {
                    offset += duration;
                }
            }
            else {
                // we've reached the canvas whose target we're adjusting
                break;
            }
        }
        t[0] = Number(t[0]) + offset;
        t[1] = Number(t[1]) + offset;
        return targetWithoutTemporal + '#t=' + t[0] + ',' + t[1];
    }
    return undefined;
}
//# sourceMappingURL=retarget-temporal-component.js.map