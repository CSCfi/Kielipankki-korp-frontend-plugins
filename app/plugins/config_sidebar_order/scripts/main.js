
// Initialize the "order" property (supported natively by Språkbanken's
// Korp) of all attributes of all the corpora in settings.corpora based
// on settings.default_sidebar_display_order and the corpus-specific
// sidebar_display_order properties.
//
// Even though might be better to move eventually to specifying order
// directly in the attribute definitions, as it is supported natively
// by Språkbanken's Korp, this might make the transition easier.

util.initCorpusSettingsAttrDisplayOrder = () => util.forAllCorpora(util.setAttrDisplayOrder);

// Initialize the "order" property of each attribute of corpusInfo to
// contain the order number in which the attribute is to be shown in
// the sidebar (largest first), separately for (positional) attributes,
// struct_attributes and link_attributes.
//
// The order may be specified in corpusInfo.sidebar_display_order or
// the default settings.default_sidebar_display_order. These are
// objects with the keys attributes, struct_attributes and
// link_attributes, whose values are lists of attribute names or
// regular expressions matching attribute names, in the order in which
// the attributes should be shown. Attributes with an explicit order
// property in the definitions are shown first, and unlisted attributes
// are shown after the listed ones in the order JavaScript iterates
// over the attribute properties. The mutual order of multiple
// attributes matching a single regular expression is the JavaScript
// property iteration order. (Jyrki Niemi 2015-08-27, 2017-10-19)

util.setAttrDisplayOrder = function(corpusInfo) {

    // Add change attr_info[attr_name] to a copy of itself, extended
    // with {order: order}. We make a copy of the attribute definition
    // object, so that the order previoiusly assigned to an attribute
    // with a shared definition (when processing another corpus) does
    // not affect the order of this corpus. Copies require more memory,
    // since the attribute definitions are no longer shared, but it is
    // enough to make a shallow copy, so that the value of the dataset
    // property remains shared.
    const set_order = (attr_info, attr_name, order) => attr_info[attr_name] =
        $.extend({}, attr_info[attr_name], {order});

    for (let attr_type of ["attributes", "struct_attributes", "link_attributes"]) {
        const order_spec = ((corpusInfo.sidebar_display_order != null ? corpusInfo.sidebar_display_order[attr_type] : undefined) ||
                      (settings.default_sidebar_display_order != null ? settings.default_sidebar_display_order[attr_type] : undefined));
        // c.log "setAttrDisplayOrder", corpusInfo, order_spec
        if (order_spec) {
            var attr_info = corpusInfo[attr_type];
            // If all the attributes already have an order property,
            // nothing needs to be done here.
            const existing_orders = _.pluck(attr_info, "order");
            if (_.all(existing_orders)) {
                continue;
            }
            let min_existing_order = _.min(existing_orders);
            if (min_existing_order === Infinity) {
                min_existing_order = 100;
            }
            const attr_names = _(attr_info)
                         .keys()
                         .filter(key => attr_info[key].order == null)
                         .value();
            // Add order values in a decreasing order below the minimum
            // existing one.
            let next_order = min_existing_order - 1;
            for (let pattern of order_spec) {
                if ($.type(pattern) === "regexp") {
                    for (let attr_name of attr_names) {
                        if (attr_name.match(pattern) &&
                                (attr_info[attr_name].order == null)) {
                            set_order(attr_info, attr_name, next_order);
                            next_order -= 1;
                        }
                    }
                } else if ($.type(pattern) === "string") {
                    const index = $.inArray(pattern, attr_names);
                    if (index !== -1) {
                        set_order(attr_info, attr_names[index], next_order);
                        next_order -= 1;
                    }
                }
            }
        }
    }
};
