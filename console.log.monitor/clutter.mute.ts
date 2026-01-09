/**
 * clutter.mute.ts
 * Manages console output to prevent cluttering the Replit/Browser console.
 */

export const silenceClutter = (forceShow: boolean = false) => {
  // If forceShow is true, or we are NOT in production, let logs pass through
  if (process.env.NODE_ENV === "production" && !forceShow) {
    const silent = () => {};

    // Silencing standard clutter
    console.log = silent;
    console.info = silent;
    console.debug = silent;

    // We keep these active so you can still see if the app crashes
    console.warn("[System] High-level warnings active.");
    console.error("[System] Critical error reporting active.");
  } else {
    console.log("[System] Debug mode: All logs visible.");
  }
};
