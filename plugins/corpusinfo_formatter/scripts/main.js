
// Plugin corpusinfo_formatter
//
// Callback methods to format (extra) corpus information in the corpus
// information popup and sidebar.


c.log("plugin corpusinfo_formatter")

// Class CorpusInfoFormatter does not have internal state, but a class
// is defined so that the callback functions can call internal methods
// containing the actual implementation.

class CorpusInfoFormatter {

    constructor () {
        // Plugin name
        this.name = "corpusinfo_formatter"
    }

    // Callback methods

    // Format extra corpus info in corpusObj for the corpus info popup,
    // appending to description descr.
    formatPopupCorpusInfo (descr, corpusObj) {
        // c.log("CorpusInfoFormatter.formatCorpusInfoDescr", descr)
        return this._formatCorpusInfo(descr, corpusObj, "infoPopup")
    }

    // Format extra corpus folder info in folder for the corpus info
    // popup, appending to description descr.
    formatPopupFolderInfo (descr, folder) {
        // c.log("CorpusInfoFormatter.formatFolderInfoDescr", descr)
        return (folder.info
                ? this._formatCorpusInfo(descr, folder.info, "infoPopup")
                : descr)
    }

    // Format extra corpus info in corpusObj for the sidebar; descr is
    // initially empty but present for consistency with the above
    // methods.
    formatSidebarCorpusInfo (descr, corpusObj) {
        // c.log("CorpusInfoFormatter.formatSidebarCorpusInfo", descr)
        return this._formatCorpusInfo(descr, corpusObj, "sidebar")
    }

    // Private methods

    // Format (extra) corpus information available in corpusObj,
    // appending to possible description descr, for target (either
    // "infoPopup" or "sidebar").
    _formatCorpusInfo (descr, corpusObj, target) {
        // c.log("CorpusInfoFormatter.formatCorpusInfoDescr", descr)
        const corpusExtraInfo =
            settings.corpusExtraInfo ?
                this._formatCorpusExtraInfo(
                    corpusObj,
                    {
                        info_items: settings.corpusExtraInfo[target],
                        static_localization: target == "infoPopup",
                        item_paragraphs: target == "sidebar",
                    })
            :
                undefined
        if (corpusExtraInfo) {
            descr += ((descr && target == "infoPopup" ? "<br/><br/>" : "") +
                      corpusExtraInfo)
        }
        return descr
    }

    // Format extra information associated with a corpus object,
    // typically a URN, licence information and various links. An
    // optional second argument specifies an object containing options
    // as properties. The supported options are:
    // - info_items: an array of items (properties in the corpus
    //   configuration) to be formatted.
    // - item_paragraphs: if true, enclose each item in <p>...</p>;
    //   otherwise separate them with <br/>
    //
    // The information items are usually composite objects which may
    // contain the properties "name", "description", and "url" or
    // "urn". If the information contains "name", it is presented as
    // follows: a label and a colon (unless the property "no_label" is
    // true or the item is "homepage"), followed by the name as a link
    // to the URN or URL (or if neither URN nor URL, no link).
    // Otherwise, the label is a link to the URN or URL. The label is
    // the localized string for the key "corpus_" + item name. The
    // optional description is a represented as a tooltip (HTML title
    // attribute).
    //
    // Alternatively, an information item may be an array of such
    // composite object, in which case they are formatted in the order
    // in which they are in the array. If a composite object in an
    // array contains the property "subtype", the label is the
    // localized string for the key "corpus_" + item name + "_" + the
    // value of the subtype property.
    //
    // If an item needs no separate name, the simple properties X_urn
    // and X_url can be used instead of X: { urn: ... } (similarly for
    // url). The item "urn" is treated specially: it shows the value
    // of the "urn" property as the link text.
    //
    // TODO: Add an option for presenting the description as a text
    // following the link text. It could be used in the corpus info
    // popup instead of the tooltip.

    _formatCorpusExtraInfo (corpusObj, opts = {}) {
        // c.log("_formatCorpusExtraInfo", corpusObj, opts)
        const info_items =
            opts.info_items ?
                opts.info_items
            :
                (settings.corpusExtraInfoItems != null) || [];
        const item_paragraphs = opts.item_paragraphs || false;

        // Get the value of a URN (preferred, prefixed with resolver
        // URL) or URL property in obj. The optional second argument
        // specifies the property name prefix to "urn" or "url".
        const getUrnOrUrl = function(obj) {
            const prefix = arguments.length > 1 ? arguments[1] : '';
            if ((prefix + 'urn') in obj) {
                return util.makeUrnUrl(obj[prefix + 'urn']);
            } else {
                return obj[prefix + 'url'];
            }
        };

        // Return an HTML link (or text), given link_info, which may
        // contain the properties "label", "url", "text" and
        // "tooltip".
        const makeLinkItem = function(link_info) {
            let result = '';
            if (link_info.label) {
                result += link_info.label + ': ';
            }
            if (link_info.url) {
                const href = link_info.url.indexOf('{{') !== -1 ?
                           'ng-href'
                       :
                           'href';
                result += '<a ' + href + '=\'' + link_info.url +
                    '\' target=\'_blank\'' +
                    (link_info.tooltip ?
                        ' title=\'' + link_info.tooltip + '\''
                    :
                        '') +
                    '>' + link_info.text + '</a>';
            } else if (link_info.text) {
                if (link_info.tooltip) {
                    result += '<span class=\'has_hover_text\' title=\'' +
                        link_info.tooltip + '\'>' + link_info.text + '</span>';
                } else {
                    result += link_info.text;
                }
            }
            return result;
        };

        const makeLinkInfos = function(info_item) {

            const makeLabel = function(info_item) {
                // Use rel='localize[...]' instead of
                // util.getLocaleString, so that the texts are
                // re-localized immediately when switching languages.
                // TODO: Convert to use the new localization method
                if (opts.static_localization) {
                    // This works in the corpus info popup
                    return util.getLocaleString('corpus_' + info_item);
                } else {
                    // This works in the sidebar
                    return (`<span rel='localize[corpus_${info_item}]'>` +
                            `Corpus ${info_item}</span>`);
                    // Why does this Angular localization not work?
                    // return `<span>{{'corpus_${info_item}' | loc:lang}}<span>`;
                }
            };

            const makeLinkInfoBase = function(info_obj, label) {
                const link_info = {url: getUrnOrUrl(info_obj)};
                if (info_obj.name) {
                    link_info.text = info_obj.name;
                    if (!info_obj.no_label) {
                        link_info.label = label;
                    }
                } else {
                    link_info.text = label;
                }
                if (info_obj.description) {
                    link_info.tooltip = info_obj.description;
                }
                return link_info;
            };

            const linkInfoIsNotEmpty = (link_info) =>
                  link_info && (link_info.url || link_info.text);

            let link_info = null;
            let label = makeLabel(info_item);
            let makeInfoItem = settings.makeCorpusExtraInfoItem[info_item]
            if (makeInfoItem && ! _.isFunction(makeInfoItem)) {
                if (_.isFunction(makeInfoItem.makeLinkInfo)) {
                    makeInfoItem = makeInfoItem.makeLinkInfo
                } else {
                    makeInfoItem = null
                }
            }
            if (makeInfoItem) {
                link_info = makeInfoItem(corpusObj, label)
            }
            if (! link_info) {
                const corpus_info_item = corpusObj[info_item];
                if (corpus_info_item) {
                    if (Array.isArray(corpus_info_item)) {
                        const link_infos = [];
                        const base_label = label;
                        for (let info_item_sub of corpus_info_item) {
                            if ("subtype" in info_item_sub) {
                                label = makeLabel(
                                    info_item + '_' + info_item_sub.subtype);
                            } else {
                                label = base_label;
                            }
                            const link_info_base = makeLinkInfoBase(
                                info_item_sub, label);
                            if (linkInfoIsNotEmpty(link_info_base)) {
                                link_infos.push(link_info_base);
                            }
                        }
                        return link_infos;
                    } else {
                        link_info = makeLinkInfoBase(corpus_info_item, label);
                    }
                } else if (corpusObj[info_item + '_urn'] ||
                         corpusObj[info_item + '_url']) {
                    // Simple *_urn or *_url properties
                    link_info = {
                        url: getUrnOrUrl(corpusObj, info_item + '_'),
                        text: label
                    };
                }
            }
            if (linkInfoIsNotEmpty(link_info)) {
                return [link_info];
            } else {
                return [];
            }
        };

        const result = [];
        for (let info_item of info_items) {
            let makeInfoItem = settings.makeCorpusExtraInfoItem[info_item]
            for (let link_info of makeLinkInfos(info_item)) {
                let html = makeLinkItem(link_info)
                if (makeInfoItem && makeInfoItem.postprocess) {
                    html = makeInfoItem.postprocess(corpusObj, html)
                }
                result.push(html)
            }
        }
        if (item_paragraphs) {
            return '<p>' + result.join('</p><p>') + '</p>';
        } else {
            return result.join('<br/>');
        }
    }

}


// Register the plugin
plugins.register(new CorpusInfoFormatter())


// Return the URN resolver URL for an URN: prefix
// settings.urnResolver unless the URN string begins with "http".
util.makeUrnUrl = function (urn) {
    if (urn.indexOf('http') !== 0) {
        return settings.urnResolver + urn;
    } else {
        return urn;
    }
};
