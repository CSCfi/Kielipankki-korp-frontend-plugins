
// Plugin config_augment_info
//
// Callback methods to augment corpus (and folder) information based
// on site-configurable properties in the corpus (folder)
// configuration. This can be used, for example, to append a status
// like "(beta)" to the corpus name and a corresponding localizable
// text to the description.
//
// The configurable properties are defined in
// settings.augmentCorpusInfoProperties, which is an object, whose
// property names are the names of properties in corpus (folder)
// configurations and their values are objects with (some of) the
// following properties:
// - valueType: the type of the value of the property; currently the
//   only supported value is "stringlist": an array of string values
//   or a string of values separated by commas or spaces
// - values: an array of string supported values for property
// - localizeDescription: if true, localize the description using
//   translation key corpusinfo_descr_<property>_<value>
// - augmentTitle: function (title, value): add value to existing
//   title (default: append value in parentheses)
// - augmentDescription: function (description, value): add value to
//   existing description (default: append "<br/><br/>" and value,
//   localized if localizeDescription is true)

// TODO:
// - Add support for boolean properties: if true, augment title and
//   description with a fixed string, otherwise do nothing


// Initialize settings.augmentCorpusInfoProperties to an empty object
// if it has not been defined (in config.js)
plugins.setDefaultSettings({
    augmentCorpusInfoProperties: {},
})


// Plugin class

class ConfigInfoAugmenter {

    constructor () {
        // Plugin name
        this.name = "config_augment_info"
        // This plugin needs to be registered after a plugin providing
        // feature "corpusInfo", so that the properties have been
        // propagated from corpus folders to individual corpora.
        this.requiresFeatures = ["corpusInfo"]
    }

    // Initialize by adding default augmentTitle and
    // augmentDescription functions to property specifications without
    // them
    initialize () {
        for (let propName in settings.augmentCorpusInfoProperties) {
            let propSpec = settings.augmentCorpusInfoProperties[propName]
            propSpec.augmentTitle = (
                propSpec.augmentTitle ||
                    ((title, value) => `${title} (${value})`))
            propSpec.augmentDescription = (
                propSpec.augmentDescription ||
                    ((descr, value) => `${descr}<br/><br/>${value}`))
        }
    }

    // Callback methods

    // Augment corpus and folder titles and descriptions
    modifyCorpusConfigs (corpora, corporafolders) {
        this._augmentCorpusInfo(corpora, corporafolders)
    }

    // Internal methods

    // Augment corpus and folder titles and descriptions
    _augmentCorpusInfo (corpora, corporafolders) {
        for (let corpusId in corpora) {
            let corpus = corpora[corpusId]
            this._augmentInfo(corpus, corpus)
        }
        for (let folder in corporafolders) {
            this._augmentFolderInfo(corporafolders[folder])
        }
    }

    // Augment the title and description of folder and its subfolders
    // (recursively)
    _augmentFolderInfo (folder) {
        if (folder.info) {
            this._augmentInfo(folder, folder.info)
        }
        for (let subfolderName of Object.keys(folder || {})) {
            const subfolder = folder[subfolderName];
            if (window.isSubfolderName(subfolderName)) {
                this._augmentFolderInfo(subfolder);
            }
        }
    }

    // Augment the title and description of target (corpus or folder
    // configuration) based in the properties in info (corpus
    // configuration or the info object of a folder configuration)
    _augmentInfo (target, info) {
        for (let propName in settings.augmentCorpusInfoProperties) {
            if (info[propName]) {
                let propSpec = settings.augmentCorpusInfoProperties[propName]
                // An array of strings or a string with possible
                // multiple values separated by spaces and/or commas
                if (propSpec.valueType == "stringlist") {
                    let values = info[propName]
                    if (! _.isArray(values)) {
                        values = values.split(/[,\s]+/)
                    }
                    for (let value of values) {
                        // Ignore the value if the property
                        // configuration defines allowed values but
                        // the value is not one of them
                        if (! propSpec.values ||
                                propSpec.values.includes(value)) {
                            target.title = propSpec.augmentTitle(
                                target.title, value)
                            if (propSpec.localizeDescription) {
                                let locKey =
                                    `corpusinfo_descr_${propName}_${value}`
                                value = `<span rel="localize[$locKey]">${util.getLocaleString(locKey)}</span>`
                            }
                            target.description = propSpec.augmentDescription(
                                target.description, value)
                        }
                    }
                }
                // TODO: Add support for boolean properties
            }
        }
    }

}


// Register the plugin
plugins.register(new ConfigInfoAugmenter())
