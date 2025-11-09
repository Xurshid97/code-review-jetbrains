"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWaitingIntervalManager = createWaitingIntervalManager;
/**
 * Returns a function that sequentially provides delay values
 * from the given array, and then keeps returning the last one
 * once all have been used.
 *
 * Example:
 *   const nextDelay = getLastUntilOneLeft([1000, 2000, 3000]);
 *   nextDelay(); // 1000
 *   nextDelay(); // 2000
 *   nextDelay(); // 3000
 *   nextDelay(); // 3000
 */
function getLastUntilOneLeft(arr) {
    var currentIndex = 0;
    return function getNextTimeout() {
        // Return next delay until end of array, then repeat the last value
        if (currentIndex < arr.length) {
            return arr[currentIndex++];
        }
        return arr[arr.length - 1];
    };
}
/**
 * Creates a manager for custom interval-like timers that:
 * - behave like `setInterval`, but without overlapping executions
 * - allow custom, *progressively increasing* delays
 * - clean up properly when cleared
 *
 * Usage:
 *   const manager = createWaitingIntervalManager();
 *   const id = manager.setWaitingInterval(
 *     () => console.log("tick"),
 *     [500, 1000, 2000] // delay progression
 *   );
 *   setTimeout(() => manager.clearWaitingInterval(id), 7000);
 */
function createWaitingIntervalManager() {
    // Keeps track of all active intervals
    var map = new Map();
    // Unique incremental ID for each created interval
    var waitingIntervalId = 0;
    /**
     * Starts a managed "waiting interval".
     *
     * @param handler - The callback to run each cycle
     * @param timeouts - Array of delay durations to use progressively
     * @param args - Optional arguments passed to the handler
     * @returns A unique interval ID for cleanup
     */
    function setWaitingInterval(handler, timeouts) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        waitingIntervalId += 1;
        var id = waitingIntervalId;
        // Create a delay generator function (preserves state between calls)
        var getNextDelay = getLastUntilOneLeft(timeouts);
        // Recursive timeout-based loop
        function internalHandler() {
            handler.apply(void 0, args); // Call user callback
            var delay = getNextDelay(); // Get next delay value
            var timeoutId = setTimeout(internalHandler, delay);
            map.set(id, timeoutId); // Track timeout for cleanup
        }
        // Schedule the first execution
        var firstDelay = getNextDelay();
        var timeoutId = setTimeout(internalHandler, firstDelay);
        map.set(id, timeoutId);
        return id;
    }
    /**
     * Clears a managed waiting interval by ID.
     * Ensures both the timeout and its map entry are removed.
     */
    function clearWaitingInterval(intervalId) {
        var realTimeoutId = map.get(intervalId);
        if (typeof realTimeoutId === "number") {
            clearTimeout(realTimeoutId);
            map.delete(intervalId);
        }
    }
    // Return public API
    return { setWaitingInterval: setWaitingInterval, clearWaitingInterval: clearWaitingInterval };
}
/* ---------------- Example Usage ---------------- */
var manager = createWaitingIntervalManager();
var id = manager.setWaitingInterval(function () { return console.log("Hello, world!"); }, [1000, 2000, 3000] // Delay progression
);
// Stop the interval after 10 seconds
setTimeout(function () { return manager.clearWaitingInterval(id); }, 10000);
