
// Initialize the link_attributes properties in all the corpora in
// settings.corpora.
util.initCorpusSettingsLinkAttrs = function() {
    for (let corpus in settings.corpora) {
        util.extractLinkAttrs(settings.corpora[corpus]);
    }
    return null;
};

// Initialize the link_attributes property in corpusInfo to contain
// the attributes with type "url" and url_opts.in_link_section true.
// These attributes are shown in a separate section in the sidebar.
// The original attributes are marked as hidden.
util.extractLinkAttrs = function(corpusInfo) {

    const extractLinkAttrs = function(attrs, link_attrs) {
        if (attrs != null) {
            return (() => {
                const result = [];
                for (let attrname in attrs) {
                    const attr = attrs[attrname];
                    if ((attr.type === "url") && (attr.url_opts != null) && attr.url_opts.in_link_section) {
                        if (attr._link_attr) {
                            // This attribute was already handled via
                            // another reference; that happens when many
                            // corpora use the same attribute definitions
                            // objects.
                            result.push(link_attrs[attrname] = attr._link_attr);
                        } else {
                            // Make a deep copy of the attr object
                            link_attrs[attrname] = $.extend(true, {}, attr);
                            // The original attribute cannot be deleted
                            // (without making more modifications
                            // elsewhere) because Korp only requests from
                            // the backend the attributes mentioned in
                            // attributes or struct_attributes.
                            attrs[attrname].displayType = "hidden";
                            result.push(attrs[attrname]._link_attr = link_attrs[attrname]);
                        }
                    } else {
                        result.push(undefined);
                    }
                }
                return result;
            })();
        }
    };

    const link_attrs = {};
    extractLinkAttrs(corpusInfo.attributes, link_attrs);
    extractLinkAttrs(corpusInfo.struct_attributes, link_attrs);
    corpusInfo.link_attributes = link_attrs;
    return null;
};
