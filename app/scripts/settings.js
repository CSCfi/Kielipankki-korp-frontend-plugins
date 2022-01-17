/** @format */

/**
 * function to set default values if parameters have been left out of config.js
 */
export function setDefaultConfigValues() {
    if (!settings.hitsPerPageValues) {
        settings.hitsPerPageValues = [25, 50, 75, 100]
    }
    if (!settings.hitsPerPageDefault) {
        settings.hitsPerPageDefault = settings.hitsPerPageValues[0]
    }
    if (!settings.groupStatistics) {
        settings.groupStatistics = []
    }
    if (! settings.backendURLMaxLength) {
        // The default maximum URI length for Apache is 8190 but keep
        // some safety margin
        settings.backendURLMaxLength = 8100
    }
    if (! settings.languageNames) {
        // Names of UI languages in the languages themselves, as shown
        // in the language menu, so they need not be localized
        settings.languageNames = {
            "sv": "Svenska",
            "en": "English",
        }
    }
    if (! settings.handleUnavailableCorpora) {
        // A corpus defined in the configuration but not found by the
        // backend causes an error that stops loading Korp
        settings.handleUnavailableCorpora = "fatal"
    }
}
