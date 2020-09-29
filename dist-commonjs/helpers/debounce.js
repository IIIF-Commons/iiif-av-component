"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function debounce(fn, debounceDuration) {
    // summary:
    //      Returns a debounced function that will make sure the given
    //      function is not triggered too much.
    // fn: Function
    //      Function to debounce.
    // debounceDuration: Number
    //      OPTIONAL. The amount of time in milliseconds for which we
    //      will debounce the function. (defaults to 100ms)
    debounceDuration = debounceDuration || 100;
    return function () {
        if (!fn.debouncing) {
            var args = Array.prototype.slice.apply(arguments);
            fn.lastReturnVal = fn.apply(window, args);
            fn.debouncing = true;
        }
        clearTimeout(fn.debounceTimeout);
        fn.debounceTimeout = setTimeout(function () {
            fn.debouncing = false;
        }, debounceDuration);
        return fn.lastReturnVal;
    };
}
exports.debounce = debounce;
//# sourceMappingURL=debounce.js.map