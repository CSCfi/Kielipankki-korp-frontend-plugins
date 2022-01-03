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
    if (! settings.modeSwitchRestoreParamsExclude) {
        // By default, do not restore the UI language from the saved
        // parameters when switching modes but keep the active
        // language. This has effect only if
        // settings.modeSwitchRestoreParams == true.
        settings.modeSwitchRestoreParamsExclude = ["lang"]
    }
}
