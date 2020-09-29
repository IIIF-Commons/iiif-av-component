"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function compare(a, b) {
    var changed = [];
    Object.keys(a).forEach(function (p) {
        if (!Object.is(b[p], a[p])) {
            changed.push(p);
        }
    });
    return changed;
}
function diffData(a, b) {
    return Array.from(new Set(compare(a, b).concat(compare(b, a))));
}
exports.diffData = diffData;
//# sourceMappingURL=diff-data.js.map