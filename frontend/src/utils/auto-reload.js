export function autoReload(fn) {
  let today = new Date(),
    lastUpdate;

  [
    'focus',
    'mousemove',
    'mousedown',
    'keypress',
    'touchmove',
    'MSPointerMove',
  ].forEach((e) => {
    window.addEventListener(e, function () {
      let time = new Date();
      // If we haven't checked yet, or if it's been more than 30 seconds since the last check
      if (!lastUpdate || time.getTime() - lastUpdate.getTime() > 30000) {
        // Set the last time we checked, and then check if the date has changed.
        lastUpdate = time;
        if (time.getDate() !== today.getDate()) {
          // If the date has changed, set the date to the new date, and refresh stuff.
          today = time;

          fn();
        }
      }
    });
  });
}
