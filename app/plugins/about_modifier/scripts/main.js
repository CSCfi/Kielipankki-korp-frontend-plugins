
// Plugin about_modifier
//
// A callback method for modifying the template (HTML) of the "About
// Korp" modal by calling the function settings.aboutTemplateModifier.



// Plugin class

class AboutModifier {

    constructor () {
        // Plugin name
        this.name = "about_modifier"
        // Disable the plugin if settings.aboutTemplateModifier is not
        // defined
        this.disabled = (settings.aboutTemplateModifier == undefined)
    }

    // Callback method called at a hook point

    // For the "about" modal, call settings.aboutTemplateModifier on
    // params.template and return the result
    filterModalParams (params, modalName) {
        if (modalName == "about") {
            params.template = settings.aboutTemplateModifier(params.template)
            // c.log("filterModalParams template", params.template)
        }
        return params
    }

}


plugins.register(new AboutModifier())
