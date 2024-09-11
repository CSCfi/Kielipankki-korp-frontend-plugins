
// Plugin corpuschooser_prompt_empty
//
// A plugin to add a prompt ("Select corpora") to the top frame of the
// corpus chooser if no corpora are selected.


// Plugin class

class CorpusChooserPromptEmpty {

    // Callback methods

    // When the corpus selection is changed, check if no corpora are
    // selected, show a prompt to select corpora in the corpus chooser
    // top bar
    onCorpusChooserChange () {
        const selectedCorporaCount = $("#hp_corpora_title1").text()
        if (selectedCorporaCount == "0") {
            // #corpusbox class no-corpora-selected controls if
            // ##hp_corpora_promptEmpty is shown or not
            $("#corpusbox").addClass("no-corpora-selected")
            if ($("#hp_corpora_promptEmpty").length === 0) {
                // Add #hp_corpora_promptEmpty if it is not yet there
                $("#hp_corpora_title1").before(
                    `<span id="hp_corpora_promptEmpty">
                       <span rel="localize[corpselector_prompt_empty]">` +
                        // Pre-localize the string, as otherwise it might
                        // be localized only when changing languages
                        util.getLocaleString("corpselector_prompt_empty") +
                        `</span>:&#x2000;
                     </span>`)
            }
        } else {
            $("#corpusbox").removeClass("no-corpora-selected")
        }
    }

}


// Register the plugin
plugins.register(new CorpusChooserPromptEmpty())
