
// Plugin config_url_opts
//
// Plugin with a callback method to add a "pattern" property to
// attribute configurations with the appropriate urlOpts, for
// rendering a link without having to modify sidebar code.


class ConfigUrlOpts {

    // Initialize this.attrGroups, so that it need not be initialized
    // separately for each corpus
    constructor () {
        this.attrGroups = [
            "attributes",
            "structAttributes",
            "customAttributes",
            "linkAttributes",
        ]
    }

    // Callback method called at a hook point

    // Call _convertUrlOpts for all corpora in corpora
    modifyCorpusConfigs (corpora) {
        for (let corpusId in corpora) {
            this._convertUrlOpts(corpora[corpusId])
        }
    }

    // Internal methods

    // If corpus configuration corpusObj has urlOpts.newWindow or
    // urlOpts.hideUrl (and no pattern), add an appropriate pattern
    // for rendering the link in the sidebar.
    _convertUrlOpts (corpusObj) {
        for (let attrgroup of this.attrGroups) {
            for (let attrname in (corpusObj[attrgroup] || {})) {
                let attr = corpusObj[attrgroup][attrname];
                let urlOpts = attr.urlOpts
                if (! urlOpts) {
                    continue
                }
                if (! attr.pattern && (urlOpts.newWindow || urlOpts.hideUrl)) {
                    let target = (urlOpts.newWindow !== false
                                  ? " target=\"_blank\"" : "")
                    let pattBegin = `<a href="<%= val %>" class="exturl sidebar_link"${target}>`
                    if (urlOpts.hideUrl && attr.label) {
                        attr.pattern = `${pattBegin}<span rel="localize[${attr.label}]"></span></a>`
                        // Prevent sidebar from adding a separate
                        // label but allow using it in the attribute
                        // lists of the extended search and statistics
                        attr.sidebarHideLabel = true
                        // Change type, as type === "url" is tested
                        // before pattern when rendering attributes in
                        // the sidebar; "urlPattern" allows this to be
                        // recognized if needed
                        attr.type = "urlPattern"
                    } else {
                        attr.pattern = `${pattBegin}<%= val %></a>`
                    }
                }
                // Hide URLs to be shown in the link section from the
                // extended search, statistics and comparison, unless
                // the corresponding hide property has explicitly been
                // set
                if (urlOpts.inLinkSection) {
                    for (let type of ["Statistics", "Extended", "Compare"]) {
                        if (attr["hide" + type] === undefined) {
                            attr["hide" + type] = true
                        }
                    }
                }
            }
        }
    }

};


// Register the plugin
plugins.register(new ConfigUrlOpts())
