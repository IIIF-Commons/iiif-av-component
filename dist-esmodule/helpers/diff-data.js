function compare(a, b) {
    var changed = [];
    Object.keys(a).forEach(function (p) {
        if (!Object.is(b[p], a[p])) {
            changed.push(p);
        }
    });
    return changed;
}
export function diffData(a, b) {
    return Array.from(new Set(compare(a, b).concat(compare(b, a))));
}
//# sourceMappingURL=diff-data.js.map