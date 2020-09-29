export function formatTime(aNumber) {
    var hours, minutes, seconds, hourValue;
    seconds = Math.ceil(aNumber);
    hours = Math.floor(seconds / (60 * 60));
    hours = hours >= 10 ? hours : '0' + hours;
    minutes = Math.floor((seconds % (60 * 60)) / 60);
    minutes = minutes >= 10 ? minutes : '0' + minutes;
    seconds = Math.floor((seconds % (60 * 60)) % 60);
    seconds = seconds >= 10 ? seconds : '0' + seconds;
    if (hours >= 1) {
        hourValue = hours + ':';
    }
    else {
        hourValue = '';
    }
    return hourValue + minutes + ':' + seconds;
}
//# sourceMappingURL=format-time.js.map