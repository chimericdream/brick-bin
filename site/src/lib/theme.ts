/** Where the System, Light or Dark choice is kept (SPEC 6.4). Mantine stores "auto" for System. */
export const THEME_STORAGE_KEY = 'bb-theme';

/** Runs in <head> before first paint: scripts are on, so the no-script fallbacks can go. */
export const NO_JS_SCRIPT = 'document.documentElement.classList.remove("no-js")';
