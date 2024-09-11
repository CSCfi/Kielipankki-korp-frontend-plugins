
// Plugin corpus_aliases
//
// Callback method to modify the location (parameter "corpus"),
// mapping possible corpus id aliases to actual corpus ids. Aliases
// are defined in settings.corpusAliases, whose property keys are
// aliases and values the actual corpus ids, separated by commas. The
// corpus ids may also be regular expressions that are expanded to the
// corpora mathing the regexp.
//
// Aliases can be useful if a corpus is renamed: the old name (id) can
// be retained as an alias to avoid breaking possible URLs containing
// the old id of the corpus. An alias may also be used a shorthand for
// a list of corpora. Regular expressions allow the denotation of the
// alias to expand if new corpora matching the regexp are added to Korp
// (or old ones removed).


class CorpusAliasMapper {

    constructor () {
        // Require feature "licenceCategory", as checking if login is
        // needed for the expanded corpora checks the limitedAccess
        // property possibly set along with licence category
        this.requiresFeatures = ["licenceCategory"]
    }

    // Callback method called at a hook point

    // If settings.corpusAliases, map the corpus ids in the hash
    // parameter "corpus" according to it and modify
    // window.location.hash accordingly. This has to be done after the
    // mode file has been loaded, as it may specify corpus aliases, so
    // hook to modifyLocationOnDomReady instead of modifyLocation.
    modifyLocationOnDomReady (location) {
        if (settings.corpusAliases) {
            const origCorpus = this._getUrlParam(location.hash, "corpus");
            if (origCorpus) {
                const corpus = this._mapCorpusAliasList(origCorpus);
                if (corpus !== origCorpus) {
                    c.log("mapHashCorpusAliases", origCorpus, "->", corpus);
                    window.location.hash = window.location.hash.replace(
                        "corpus=" + origCorpus, "corpus=" + corpus);
                    // Check if the expanded value contains corpora
                    // requiring logging in
                    this._checkLoginNeededFor(corpus)
                }
            }
        }
    }

    // Internal methods

    // Extract the value of the URL parameter name from params
    _getUrlParam (params, name) {
        const paramRe = RegExp("\\b" + name + "=([^&;]*)");
        const matches = window.location.hash.match(paramRe);
        return ((matches && matches.length > 1) ? matches[1] : null);
    };

    // Map corpus parameter (comma-separated list of corpus ids or
    // aliases) to a list with aliases expanded
    _mapCorpusAliasList (corpus) {
        return _.map(
            corpus.split(","),
            corpusId => (
                corpusId in settings.corpusAliases
                    ? this._expandCorpusSpec(settings.corpusAliases[corpusId])
                    : corpusId
            )
        ).join(",");
    };

    // If corpusSpecList is a list of regular expressions separated by
    // commas, expand each regexp to alist of corpus ids matching it,
    // separated by commas; otherwise return corpusSpecList as is.
    _expandCorpusSpec (corpusSpecList) {
        if (/[^a-z0-9_,-]/.test(corpusSpecList)) {
            let corpora = [];
            for (let corpSpec of corpusSpecList.split(",")) {
                if (/[^a-z0-9_,-]/.test(corpSpec)) {
                    corpora = corpora.concat(
                        this._listMatchingCorpora(corpSpec));
                } else {
                    corpora.push(corpSpec)
                }
            }
            return corpora.join(",");
        } else {
            return corpusSpecList;
        }
    };

    // List the corpora (corpus ids) matching the regular expression
    // regex. The regular expression is implicitly anchored to the
    // beginning and end, so a corpus id must match it completely. The
    // optional second argument is an object for options. If the
    // option "inverse" is true, list corpora not matching regex. If
    // the option "sort" is true, sort the corpus ids alphabetically.
    _listMatchingCorpora (regex) {
        const corpRe = RegExp("^(" + regex + ")$");
        const opts = arguments.length > 1 ? arguments[1] : {};
        const inverse = opts.inverse;
        const result = [];
        for (let corpus in settings.corpora) {
            const match = corpRe.test(corpus);
            if ((match && ! inverse) || (inverse && ! match)) {
                result.push(corpus);
            }
        }
        if (opts.sort) {
            result.sort();
        }
        return result;
    };

    // If the user is not logged in, check if any of corpora (a string
    // of comma-separated corpus ids) requires logging in, and if they
    // do, call the plugin callbacks "filterLoginNeededFor" that may
    // redirect to the Shibboleth login page.
    //
    // Note that the function checks the limitedAccess property of
    // corpus objects, so it needs to have been set appropriately in
    // advance.
    _checkLoginNeededFor (corpora) {
        // KLUDGE: Refer to global authenticationProxy object
        // c.log("loginObj", authenticationProxy.loginObj)
        if (_.isEmpty(authenticationProxy.loginObj)) {
            let loginNeededFor = []
            for (let corpus of corpora.split(",")) {
                const corpusObj = settings.corpora[corpus]
                if (corpusObj.limitedAccess) {
                    loginNeededFor.push(corpusObj)
                }
            }
            // c.log("loginNeededFor", loginNeededFor)
            // If loginNeededFor is empty and the shibboleth_auth
            // plugin is active, the filterLoginNeededFor callback
            // redirects the browser and the call does not return
            loginNeededFor = plugins.callFilters(
                "filterLoginNeededFor", loginNeededFor)
            c.log("loginNeededFor filtered", loginNeededFor)
        }
    }

};


// Initialize settings.corpusAliases to an empty object if it is not
// yet initialized
if (! settings.corpusAliases) {
    settings.corpusAliases = {}
}


// Register the plugin
plugins.register(new CorpusAliasMapper())
