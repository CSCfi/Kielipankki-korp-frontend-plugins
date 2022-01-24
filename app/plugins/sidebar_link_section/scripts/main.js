
// Plugin sidebar_link_section
//
// Callback methods to initialize linkAttributes property in corpus
// configurations and to render it in the sidebar


// Plugin class

class MakeSidebarLinkSection {

    // Callback methods

    // Initialize the linkAttributes properties in all corpora
    modifyCorpusConfigs (corpora, corporafolders) {
        this._initCorpusSettingsLinkAttrs(corpora)
    }

    // Modify sidebar content by adding a div#selected_links below the
    // dependency tree link and adding the link attributes in
    // linkAttributes if the corpus configuration contains such.
    modifySidebarContent (ctrl, wordData, customData) {
        // console.log("modifySidebarContent", ctrl, wordData, customData)
        let corpusObj = ctrl.corpusObj
        if (! $.isEmptyObject(corpusObj.linkAttributes)) {
            // Add the div only if it does not yet exist
            if (! $("#selected_links").length) {
                $(".show_deptree").after($('<div id="selected_links">'))
            }
            // Take from customData only the attributes that are in
            // linkAttributes
            // FIXME: This works only for custom attributes of type "struct"
            let customLinkData = _.filter(
                customData.struct || [],
                function (...args) {
                    let [key, val] = args[0]
                    return corpusObj.linkAttributes[key]
                }
            )
            let links = ctrl.renderCorpusContent(
                "struct",
                wordData,
                ctrl.sentenceData,
                corpusObj.linkAttributes,
                ctrl.tokens,
                corpusObj.customAttributes || {},
                customLinkData)
            // console.log("rendered content", links)
            $("#selected_links").html(links)
        } else {
            // Empty the link section for a hit without links, so
            // that links from the previously shown hit are not shown
            $("#selected_links").empty()
        }
    }

    // Internal methods

    // Initialize the linkAttributes properties in all the corpora in
    // settings.corpora.
    _initCorpusSettingsLinkAttrs (corpora) {
        for (let corpus in corpora) {
            this._extractLinkAttrs(corpora[corpus])
        }
    };

    // Initialize the linkAttributes property in corpusInfo to contain
    // the attributes with type "url" and urlOpts.inLinkSection true.
    // These attributes are shown in a separate section in the sidebar.
    // The original attributes are marked as hidden.
    _extractLinkAttrs (corpusInfo) {

        const extractLinkAttrs = function (attrs, linkAttrs) {
            if (attrs) {
                for (let attrname in attrs) {
                    const attr = attrs[attrname]
                    // Only test for urlOpts.inLinkSection, regardless
                    // of type == "url", as some attributes might not
                    // have the latter
                    if (attr.urlOpts && attr.urlOpts.inLinkSection) {
                        if (attr._linkAttr) {
                            // This attribute was already handled via
                            // another reference; that happens when many
                            // corpora use the same attribute definitions
                            // objects.
                            linkAttrs[attrname] = attr._linkAttr
                        } else {
                            // Make a deep copy of the attr object
                            linkAttrs[attrname] = $.extend(true, {}, attr)
                            // The original attribute cannot be deleted
                            // (without making more modifications
                            // elsewhere) because Korp only requests from
                            // the backend the attributes mentioned in
                            // attributes or structAttributes.
                            attrs[attrname].displayType = "hidden"
                            attrs[attrname]._linkAttr = linkAttrs[attrname]
                        }
                    }
                }
            }
        }

        const linkAttrs = {}
        extractLinkAttrs(corpusInfo.attributes, linkAttrs)
        extractLinkAttrs(corpusInfo.structAttributes, linkAttrs)
        extractLinkAttrs(corpusInfo.customAttributes, linkAttrs)
        corpusInfo.linkAttributes = linkAttrs
    }

}


// Register the plugin
plugins.register(new MakeSidebarLinkSection)
