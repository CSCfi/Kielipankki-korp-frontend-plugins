<div lang="en">

[\[Importing corpus data to Korp: technical documentation\]](../)

# Adding a corpus to the Korp frontend (configuration) {#adding-a-corpus-to-the-korp-frontend-configuration .first}

## General principles

To make a corpus visible in the Korp frontend and to make Korp know
how its content can be searched and represented, information on the
corpus needs to be added to the configuration files of the Korp
frontend (JavaScript files). In addition, you may need to add
translations of attribute names (and possibly values) if they are not
already present. The Korp configuration files reside in the
[Kielipankki-korp-frontend Git(Hub)
repository](https://github.com/CSCfi/Kielipankki-korp-frontend/),
along with other Korp frontend code. As several corpora may be in the
configuration stage at the same time and as their configurations may
need adjustments in the process, you should make a new *branch* in the
repository for each corpus to be configured, which allows independent
development of the configurations. It is recommended that the branch
name is of the form `corp-corpusname` where corpusname is the name of
the corpus (or its abbreviation). After cloning the repository, you
can make a new branch and check it out (make it the current working
branch) with the commands:

    git branch branch_name
    git checkout branch_name

When the corpus is to be deployed into production, the corpus-specific
configuration branch is merged to the `master` branch of the
repository. For more information on using branches in Git, please see
the [Git instructions](../git/#Branches). (Note that when eventually
upgrading Korp to version 7 or 8, the corpus configurations will be
separated from other Korp frontend code, possibly to a separate branch
or set of branches in the Kielipankki-korp-frontend repository.)
Further information on Korp configuration is available on [the Korp
frontend information page of
Språkbanken](https://github.com/spraakbanken/korp-frontend/). However,
note that on the one hand, Kielipankki’s Korp is still an older
version that does not have all the features of Språkbanken’s Korp, but
on the other hand, the former has some extensions that the latter does
not. If the Korp Web page does not open after the startup screen or if
it does not work after modifying configuration or translation files,
very likely a modification contained a (syntax) error. The developer’s
tools of a Web browser may help in debugging. In the following
instructions, the references to the files of the Korp frontend are
relative to the root of the Korp installation. In the
[Kielipankki-korp-frontend Git
repository](https://github.com/CSCfi/Kielipankki-korp-frontend/), it
is `app/` (relative to the root of the repository) and in the various
test instances of Korp on `korp.csc.fi` it is
`/var/www/html/test-version/`, where version may be a corpus name (or
abbreviation), or e.g. `jn` or `ute`.

## Adding corpus configuration to a Korp configuration file

### The “mode” of a corpus

The corpora visible in Korp (Finnish corpora) are configured in the
files `modes/modename_mode.js`. Definitions common to several modes
should be added to `modes/common.js`. The following modes are
currently available:

| modename          | Corpora in the mode                                 |
|-------------------|-----------------------------------------------------|
| `default`         | Finnish-language corpora                            |
| `swedish`         | Swedish-language corpora                            |
| `other_languages` | corpora in other languages than Finnish and Swedish |
| `parallel`        | parallel corpora                                    |

\[2017-12-01: **Please note** that before Korp version 5.0.10, the
configurations for Finnish corpora were in `config.js`, along with
definitions common to several modes.\]

### Corpus folder in the corpus selector

If a corpus should have its own subtree (folder) in Korp’s corpus
selector, it is defined as follows:

    settings.corporafolders.folder = {
        title: "Folder title",
        description: "Description of the folder",
        contents: [
            "corpus1",
            "corpus2",
        ],
    };

Defined as above, `folder` contains at the leaf-node level the corpora
`corpus1` and `corpus2`. More levels of nested folders can be defined
as follows:

    settings.corporafolders.folder1 = {
        title: "Folder1 title"
        description: "Description of folder1",
    };

    settings.corporafolders.folder1.folder2a = {
        title: "Folder 2a title",
        description: "Description of folder2a",
        // Ids of the corpora directly under this folder; preferably list each id on a line of its own.
        contents: [
            "corpus1",
            "corpus2",
        ],
    };

Now `folder1` contains `folder2a` but no leaf-level corpora, and
`folder2a` contains the corpora `corpus1` and `corpus2`. Corpora
should be divided into folders (primarily) logically, for example, by
genre, not by corpus owner. If a folder would have only one corpus, it
might not need a folder of its own, unless other corpora are expected
that could be added to the same folder. The folders in a configuration
file should be sorted alphabetically by the title of the folder. Also
subfolders within a folder should be sorted alphabetically, unless
another order is more logical. (The order in the file does not
actually guarantee the order in Korp’s corpus selector, but it is
often the same.) Note that the title and description of corpus folders
and corpora cannot currently be localized according to the Korp
interface language. The titles and descriptions of corpora and folders
should in general follow the language of the corpus: Finnish for
Finnish corpora and Swedish for Swedish. For corpora in other
languages and for parallel corpora, the description may be in the
language of the corpus, in English or in Finnish, or in two or three
of these languages as deemed appropriate. The titles and descriptions
of the language-specific folders in the other-languages mode are in
the language of the corpus, English and Finnish. Please see
`modes/other_languages_mode.js` for examples: search for
`settings.corporafolders.german`, for example. In addition to the
properties `title`, `description` and `content`, a corpus folder may
have the property `info` containing further (metadata) information on
the corpus. It should (usually) be used only for folders corresponding
to logical corpora split into several physical (sub)corpora, and not
for folders grouping together different corpora of the same kind. The
`info` property may contain the properties shown and described in the
following:

    settings.corporafolders.folder1 = {
        title: "Folder1 title"
        description: "Description of folder1",
        info: {
            // URN pointing to the corpus in Korp
            urn: "urn:nbn:fi:lb-201406021",
            // URN pointing to the META-SHARE record
            metadata_urn: "urn:nbn:fi:lb-201406022",
            // Licence information; settings.licenceinfo defined in modes/common.js
            licence: settings.licenceinfo.CC_BY_30,
            // A home page (information page) of the corpus
            homepage: {
                // The link text
                name: "Information page",
                // The link URL
                url: "http://www.example.fi/",
                // No "Home page" label shown in front of the link text
                no_label: true,
            },
            // Link to information on the compiler of the corpus; the subproperties as above
            compiler: {
                name: "Kotimaisten kielten keskus",
                url: "http://www.kotus.fi/",
                no_label: true,
            },
            // The id for obtaining citation information
            cite_id: "cite-key",
        },
    };

### The configuration for a corpus

The configuration for a corpus is defined as a property of
`settings.corpora`. The following example shows the most common
information, and the comments following `//` contain further details.
Further below are separate instructions on certain special types of
attributes and on the special features parallel corpora.

    settings.corpora.corpus = {
        // The name shown in the corpus selector; often the short name of the corpus<
        title: "Corpus",
        // The description of the corpus shown when hovering the mouse over the corpus name in the corpus selector
        description: "Corpus whose name is Corpus",
        // The id of the corpus; the same as the last part of
        // settings.corpora.corpus and the name of the corpus in CWB
        id: "corpus",
        // urn, metadata_urn, licence and cite_id should be specified at the corpus level if the physical corpus corresponds
        // to the logical one (that is, if they are not specified at the corpus folder level). All the properties available
        // in the info property of corpus folders can be added directly to the configuration of a corpus.
        urn: "urn:nbn:fi:lb-2016090610",
        metadata_urn: "urn:nbn:fi:lb-20140730158",
        licence: {
            name: "CLARIN RES +PLAN +NC +PRIV 1.0",
            urn: "urn:nbn:fi:lb-2016041802",
        },
        cite_id: "FinStud86",
        // If the corpus has paragraphs marked with paragraph elements, the
        // following are settings.spWithin and settings.spContext
        within: settings.defaultWithin,
        context: settings.defaultContext,
        // The attributes of a token with the names as specified to korp-make --input-attributes
        attributes: {
            // Text input in the extended search: no displayType
            lemma: {
                // The translation key for the attribute name in the frontend; may be different from attribute name.
                label: "baseform",
                // Value comparison options for the extended search: in practice either
                // settings.defaultOptions (for text input), settings.liteOptions (for selection lists)
                // or settings.setOptions (for feature-set attributes)
                opts: settings.defaultOptions
            },
            // Selection list (fixed set of values; see further below)
            pos: {
                label: "pos",
                // Selection list
                displayType: "select",
                // The prefix for the values of this attribute in the translations files
                translationKey: "pos_",
                // Values and their corresponding translation keys
                dataset: {
                    "N": "N",
                    "A": "A",
                    "Unk": "Unknown"
                },
                opts: settings.liteOptions,
            },
            // Reference to an attribute defined earlier
            msd: attrs.msd,
        },
        // Structural attributes: in practice, the attributes in the XML elements of the VRT files
        // (only attributes of the form elem_attr, not structural attributes elem corresponding to plain elements)
        struct_attributes: {
            // The CWB structural attribute text_name corresponds to the attribute "name" of the element "text" in the VRT file
            text_name: {
                label: "text_name",
                displayType: "select",
                localize: false,
                dataset: [
                    "Korp1",
                    "Korp2",
                ],
                opts: settings.liteOptions,
            },
            paragraph_id: {
                label: "paragraph_id",
                // An attribute whose value is not shown in the search interface
                displayType: "hidden",
            },
            // Since in practice all corpora have sentence_id, it is best to use the common definition
            sentence_id: sattrs.sentence_id_hidden,
        }
    };

The titles of subcorpora of a corpus should contain the title of the
whole (logical) corpus as a part of them. Even though they are seen
under the folder representing the whole corpus in the corpus selector,
in the results only the title is shown. For example, the titles of the
Finnish subcorpora of the KLK corpus (the newspapers and magazines
corpus of the Finnish National Library) are of the form “KLK suomi
year”. In contrast, intermediate folders in the corpus selector need
not have full corpus names, for example, the decades in the KLK
corpus. It is also possible to control the order in which attributes
are shown in the sidebar of Korp’s concordance results and whether an
attribute should be shown in the sidebar or in the attribute selector
of the extended search. However, these features have been implemented
in a different way in Kielipankki’s Korp from what has been later
added to Språkbanken’s Korp, so they may change. If you need these
features now, please ask, or search `modes/default_mode.js` for
`sidebar_display_order` or `displayOnly`.

### Special types of attributes

#### Selection lists

If the value set of an attribute is fixed and relatively small
(typically fewer than 100 distinct values, preferably fewer than 50),
it may make sense to show it as a selection list in Korp’s extended
search. This allows showing the values of the attribute localized both
in the selection list and in the sidebar. A disadvantage is that at
least at present, the user can select only one value at a time in the
extended search. (Although, that can be worked around by adding
disjunctive conditions on the same attribute, it is somewhat
cumbersome.) An attribute is declared as a selection list by adding to
it the property

                displayType: "select",

If the values of the attribute should be localized, you need to define
the prefix prepended to the attribute values in the translation files:

                translationKey: "pos_",

The values of the attribute and the translation keys corresponding to
them are defined as the property `dataset` of the attribute
declaration. Its value may be either a JavaScript object or array. In
an abject, values may have translation keys differing from the values:

                dataset: {
                    "N": "N",
                    "A": "A",
                    "Unk": "Unknown"
                },

In an object, the name of the property is the value of the attribute
in the corpus (e.g., `Unk` above) and the value is the name of the
translation key (`Unknown` above). *\[TODO: Regular expressions in the
attribute values mapping.\]* If the translation keys are always the
same as the values or if the values should not be translated, it is
simpler to use an array, in which case it suffices to write each value
once:

                dataset: [
                    "N",
                    "A",
                    "Unk"
                ],

If the values of an attribute should not be translated (for example,
names of authors), the property `translationKey` is omitted and the
property `localize` is set to `false`:

                localize: false,

Moreover, the value of the property `opts` of a selection list
attribute should be `settings.liteOptions`, so that the user can only
specify the conditions *is* and *is not* in the extended search:

                opts: settings.liteOptions,

#### Links (URLs)

An attribute of type URL is specified by adding the property `type`
with the value `url`:

            file_url: {
                label: "file_url",
                type: "url",
            },

In this basic case, the KWIC sidebar shows the localized name of the
attribute followed by the (possibly abbreviated) URL as the link text.
You can specify that the localized attribute name is shown as the link
text using the property `url_opts.hide_url`:

                url_opts: {
                    hide_url: true
                },

You can also specify via `url_opts` that a link should be shown under
other attributes (`in_link_section: true`), or that the linked page
should open to a new window or tab (`new_window: true`). These
definitions have been collected to the pre-defined variable
`sattrs.link_url_opts`. The code below defines the URL attribute
`fulltext_url`, with the attribute name as the link text, link below
other attributes and the linked page opening in a new window:

            fulltext_url: {
                label: "show_fulltext",
                type: "url",
                url_opts: sattrs.link_url_opts,
                url_prefix: "http://www.example.com/",
            }

In addition, the preceding definition contains the property
`url_prefix` which defines a prefix to be prepended to attribute
values, so that a constant URL prefix may be omitted from the
attribute values in the corpus data.

#### Feature-set values

A Korp (CWB) corpus may have attributes with feature-set values, which
are in practice multi-valued attributes. Such values are indicated in
the corpus data by separating the values with vertical bars and by
having a leading and trailing vertical bar. Feature-set values are
supported in both positional and structural attributes. In the sidebar
of Korp’s concordance results, the values of a feature-set attribute
are shown beneath each other. In a Korp corpus configuration, a
feature-set attribute needs to be declared as follows:

        pos: {
            label: "pos",
            type: "set",
            opts: settings.setOptions,
            // ...
        },

Note that you must give the property `opts` the value
`settings.setOptions` instead of `settings.liteOptions`: even though
they appear the same in the extended search, with the latter, searches
would not work. Moreover, `settings.defaultOptions` does not currently
work with feature-set attributes, so value comparisons on feature-set
attributes are limited to *is* and *is not* in the extended search.

#### Synthetic (computed) attributes

The sidebar of Korp’s concordance results may show attributes computed
based on the values of other attributes, without a corresponding
attribute in the corpus data. They may be used for generating URLs
with common parts and variable parts filled from other attributes. A
synthetic attribute is defined by adding the definition of an
attribute the property `synthetic: true` and a property
`stringify_synthetic` for generating the value. For example:

        text_page_image_url: {
            label: "show_page_image",
            type: "url",
            url_opts: sattrs.link_url_opts,
            synthetic: true,
            stringify_synthetic: function (token_data) {
                return settings.fn.make_klk_page_image_url(token_data, 0);
            },
        },

The argument of the function value of `stringify_synthetic` is an
object with the following properties:

`pos_attrs`
:   The positional attributes of the current token: an object with
    each attribute as the property (name).

`struct_attrs`
:   The structural attributes of the current token, similarly to
    `pos_attrs`.

`tokens`
:   An array of all the tokens of the sentence. Each token is an
    object containing positional attributes as in `pos_attrs`. In
    addition, the property `_match` is true for the tokens in the
    actual match.

See the function `settings.fn.find_context_words` in `modes/common.js`
for an example of using the token data. Please be aware that
Språkbanken’s Korp may now have other ways of achieving similar
effects, so synthetic attribute definitions may eventually need to be
changed.

### Special attribute properties

#### Restricted corpora (licence category CLARIN ACA or CLARIN RES)

If the use of the corpus is restricted and requires logging in to
Korp, the following properties must be added to corpus settings
(otherwise they can be left out):

         limited_content: true,
         licence_type: "RES",

`licence_type` may be `RES` or `ACA` depending on the licence type.
**Note** that the information on the licence type for restricted
corpora must be added to the Korp MySQL authorization database. When
using `korp-make` that can be done with the options `--licence-type`
and `--lbr-id`. You can also use the script `korp-make-auth-info.sh`
with the same options before packaging the corpus.

#### Information link

It is possible to add a link to information on attribute values from
an info icon (ⓘ) beside the attribute in the concordance sidebar. It
can be useful in particular for attributes such as the morphosyntactic
description which have a fixed set of values but too large to be
enumerated in a value selection list. An information link for an
attribute is specified by adding to the attribute definition the
property `taginfo_url` with the URL as the value:

            sentence_signum: {
                label: "signum",
                // This URL is in the sidebar ⓘ link
                taginfo_url: "markup/dma_signumlist.html",
                // ...
            },

#### Value transformation

Sometimes it makes sense to modify the value of an attribute for
showing it in the concordance sidebar; for example, zero-width spaces
may be added to a long string without spaces at places of preferred
line breaks. The value of an attribute is transformed with the
function specified in the attribute property `transform`. The function
takes the attribute value as the argument and it should return the
value to be shown in the sidebar. For example:

    attrs.msd = {
        label: "msd",
        // ...
        // Add a zero-width space character after each vertical bar to
        // allow breaking the line there in the sidebar.
        transform: function(val) {
            return val.replace(/\|/g, "|\u200b");
        }
    };

Please be aware that this feature may change in the future, but
similar functionality will nevertheless be available.

#### Custom features in the extended search

An attribute may have custom features in the extended search, such as
a tailored selection list. This is implemented with the properties
`extended_template` and `controller`. Please see [Språkbanken’s Korp
frontend instructions](https://github.com/spraakbanken/korp-frontend/)
for some more information (although it describes a newer version of
Korp with some changes), and `modes/default_mode.js` and
`modes/other_languages_mode.js` for examples.

### Defining often-used attributes and other configuration properties

You can (and should) define reusable definitions for often-used
attributes. If a definition is common to corpora in several modes, it
should be defined in `modes/common.js`, otherwise in the configuration
file for the mode in which it is used. For parallel corpora whose
parts are also used as monolingual corpora, the definitions of common
attributes should be in `modes/common.js`. Reusable attribute
definitions can be defined as follows (the following have already been
defined):

    attrs.msd = {
        label: "msd",
        opts: settings.defaultOptions
    };

    sattrs.sentence_id_hidden = {
        label: "sentence_id",
        displayType: "hidden"
    };

By convention, the `attrs` namespace contains definitions of
positional attributes and `sattrs` structural attributes. They are
used in the configurations as follows:

    settings.corpora.sample_corpus = 
        // ...
        attributes: {
            // ...
            msd: attrs.msd,
            // ...
        },
        struct_attributes: {
            // ...
            sentence_id: sattrs.sentence_id_hidden,
            // ...
        },

In addition, complete lists of positional and structural attributes,
to be used in multiple corpora, can be defined in `attrlist` and
`sattrlist`, respectively:

    attrlist.corpus_common = {
        lemma: attrs.baseform,
        pos: attrs.pos,
        // ...
    };

    sattrlist.corpus_common = {
        text_title: sattrs.title,
        text_author: sattrs.author,
        text_author_birthyear: {
            label: "author_birthyear",
        },
        // ...
    };

    settings.corpora.sample_corpus2 = {
        // ...
        attributes: attrlist.corpus_common,
        struct_attributes: sattrlist.corpus_common,
    }

You should use the same labels (translation keys) as in other corpora
as far as possible, so that the names appearing in the Korp user
interface are the same. Another way to refer to commonly used
attributes and also other corpus settings properties is to use the
`features` property. You can define and use such a corpus feature as
follows:

    settings.corpus_features.paragraphs = {
        within: settings.spWithin,
        context: settings.spContext,
    };

    settings.corpus_features.parsed_tdt = {
        attributes: {
            lemma: attrs.baseform,
            // ...
        },
    };

    settings.corpora.sample_corpus = {
        // ...
        features: ["paragraphs", "parsed_tdt"],
        // ...
    }

The properties in `settings.corpus_features.paragraphs` and
`settings.corpus_features.parsed_tdt` are added to the properties of
`settings.corpora.sample_corpus`. They are added recursively (with
`$.extend`), so that if the corpus settings contains an `attributes`
definition, the `attributes` defined in
`settings.corpus_features.parsed_tdt` are added to them. The following
commonly-used features have already been defined and should be used
whenever appropriate:

`paragraphs`
:   The corpus contains paragraphs that can be shown as an extended
    context in the concordance result.

`parsed_tdt`
:   The corpus has been parsed with the TDT parser and contains the
    corresponding attributes.

`finer`
:   The names in the corpus has been tagged with FiNER and the corpus
    has the corresponding positional and structural attributes.

### Special features of corpus settings

#### Ignore tokens between CQP token conditions

If a corpus contains non-text tokens, such as comments or prosody
information interspersed between tokens, it may make searching easier
if they can be ignored in a multi-token search. To do so, add to the
corpus configuration the property `ignore_between_tokens_cqp`, whose
value is the CQP expression to be inserted between each two token
expressions in the CQP expression formed from an extended search
expression in Korp. For example, the following allows any number of
tokens with the part of speech `punct` between other tokens:

        ignore_between_tokens_cqp: '[pos="punct"]*',

However, please note that this takes effect only if all the selected
corpora have the same value for the `ignore_between_tokens_cqp`.
Moreover, the setting does not (at least currently) affect the simple
nor the advanced search.

### Generating subcorpus configurations with JavaScript

If a logical corpus has been divided into several (sub)corpora from
Korp’s point of view, the configurations for these (sub)corpora are
typically the same except for the id, name and description of the
corpus. In such a case it may make sense to generate the
configurations of the (sub)corpora programmatically with JavaScript
code based on a list containing only the variable parts of the
configurations. Advantages of this are that the configuration is
usually more compact and that changes need to be made to a single
place if the declarations common to all (sub)corpora need to be
modified. A drawback is that the code generating corpus configurations
is often less transparent than explicit declarations for each
(sub)corpus. The main Korp frontend configuration file
`modes/common.js` contains a couple of functions for generating corpus
configurations with common declarations. The functions are in the
`settings.fn` namespace and they are described in the following.

#### `settings.fn.add_corpus_settings`

Function `settings.fn.add_corpus_settings` adds corpus settings based
on a template of common properties and a list of corpus-specific
properties added to the template. The corpora are added to a given
corpus folder with an id with a given fixed prefix and variable suffix
part in the corpus-specific property list. It is used for the corpus
`kotus_ns_presidentti`, for example:

    settings.templ.kotus_ns_presidentti = {
       title: "",
       description: "",
       id: "",
       within: settings.spWithin,
       context: settings.spContext,
       attributes: {
           lemma: attrs.baseform,
           // ...
           lex: attrs.lemgram_hidden
       },
       struct_attributes: {
           text_title: sattrs.text_title,
           // ...
           sentence_url: sattrs.context_url
       }
    };

    settings.fn.add_corpus_settings(
       settings.templ.kotus_ns_presidentti,
       [
           { id: "ahtisaari",
             title: "Presidentti Ahtisaaren uudenvuodenpuheet",
             description: "Kokoelma sisältää presidentti Martti Ahtisaaren pitämät uudenvuodenpuheet (1995–2000). ..." },
           // ...
           { id: "svinhufvud",
             title: "Presidentti Svinhufvudin uudenvuodenpuheet",
             description: "Kokoelma sisältää presidentti P. E. Svinhufvudin pitämät uudenvuodenpuheet (1935–1937)." },
       ],
       settings.corporafolders.other_texts.kotus_ns_presidentti,
       "kotus_ns_presidentti_"
    );

`settings.fn.add_corpus_settings` takes the following arguments:
1.  a template containing the common properties for the configurations
    of all the subcorpora;
2.  a list (an array) of objects containing for each subcorpus the
    variable parts to be combined with the properties of the template;
    each item in the list must contain the property `id` that is used
    as the variable part of the corpus id;
3.  the folder (subtree) of the corpus selector to which the
    subcorpora are to be added; and
4.  a corpus id prefix to be prepended to the values of the `id`
    property in the array elements.

#### `settings.fn.extend_corpus_settings`

Function `settings.fn.extend_corpus_settings` is used to add
properties to the existing settings of multiple corpora. (The function
does not actually generate corpus settings.) It can be used as
follows:

    // The properties common to the corpora
    las2_common_props = {
        urn: "urn:nbn:fi:lb-2015050504",
        // ...
        limited_access: true,
        licence_type: "RES",
        attributes: attrlist.las2,
        struct_attributes: sattrlist.las2,
    };

    // The variable parts of the corpus settings
    settings.corpora.las2_tentit = {
        title: "LAS2 (tentit)",
        description: "Edistyneiden suomenoppijoiden korpus (tentit)",
        id: "las2_tentit",
    };
    settings.corpora.las2_esseet = {
        title: "LAS2 (esseet)",
        description: "Edistyneiden suomenoppijoiden korpus (esseet)",
        id: "las2_esseet",
    };

    // Add the common properties to the corpus settings
    settings.fn.extend_corpus_settings(
        las2_common_props, ["las2_tentit", "las2_esseet"]);

    delete las2_common_props;

`settings.fn.extend_corpus_settings` takes the following arguments:
1.  an object containing the properties to be added (recursively) to
    the corpus settings; and
2.  a list (an array) of ids of the corpora to whose settings the
    properties are to be added.

#### `settings.fn.make_folder_hierarchy`

Function `settings.fn.make_folder_hierarchy` creates corpus settings
for multiple corpora and creates a corpus folder hierarchy for them
under a specified parent folder. It is used as follows for generating
the two-level subcorpus hierarchy of the dialect corpus LA-murre
(slightly modified for illustration):

    // Corpus grouping to folders
    var la_murre_grouping = [
        // First-level subfolder: base id and name
        ["LOU", "Lounaismurteet", [
            // Second-level subfolder
            ["VarE", "Eteläinen Varsinais-Suomi", [
                // Corpus: base id and name
                ["karuna", "Karuna"],
                ["kisk", "Kisko"],
                // ...
            ] ],
            ["VarP", "Pohjoinen Varsinais-Suomi", [
                ["eura", "Eura"],
                // ...
            ] ],
        ] ],
        ["LVÄ", "Lounaiset välimurteet", [
            ["SatE", "Etelä-Satakunta", [
                ["koke", "Kokemäki"],
                // ...
            ] ],
            ["SatL", "Länsi-Satakunta", [
                ["ahla", "Ahlainen", {
                    // Modify corpus settings with these properties
                    context: settings.defaultContext,
                    within: settings.scWithin
                }],
                // ...
            ] ],
            // ...
        ] ],
        // ...
    ];

    // A template of common corpus properties
    settings.templ.la_murre = {
        within: settings.spcWithin,
        context: settings.spContext,
        attributes: {
            cleanword: {
                label: "cleanword",
                opts: settings.defaultOptions
            },
            // ...
        },
        struct_attributes: {
            text_header: {
                label: "text_header"
            },
            // ...
        }
    };

    // Actually create the folder hierarchy
    settings.fn.make_folder_hierarchy(
        settings.corporafolders.spoken.la_murre, la_murre_grouping,
        {
            id_prefix: la_murre_corpus_prefix,
            folder_description_prefix: "Lauseopin arkiston murrekorpus: ",
            corpus_title_suffix: " (LA-murre)",
            make_corpus_description: function (data) {
                return "Lauseopin arkiston murrekorpus: " + data[1];
            },
            corpus_template: settings.templ.la_murre,
        });

`settings.fn.make_folder_hierarchy` takes the following arguments:
1.  Parent folder, under which the subfolders are added.
2.  Subfolder tree: an array of the format:
    `[[ folder1_data, [[ subfolder11_data, [ corpus111_data, corpus112_data ]], [ subfolder12_data, [ corpus121_data, corpus122_data ]]], [[ folder2_data, [ corpus21_data, corpus22_data, corpus23_data ]]]`
    Folder and corpus data may be an object containing the essential
    properties for the item, or one to four array elements, the last
    of which may be a composite object and the preceding ones strings.
    The strings are the (base) values for the properties id, title and
    description. These values will be modified as specified in
    options. If one is not specified, the previous one is used. The
    possible final composite object is used to override other
    properties in the configuration template specified in options.
3.  Options: an object that may contain the following properties:

    `folder_template`, `corpus_template`
    :   An object to be used as the base configuration properties for
        folders and corpora, respectively (default: `{}`).

    ({`folder`,`corpus`}`_`){`id`,`title`,`description`}`_`{`prefix`,`suffix`}
    :   A string to be prefixed or suffixed to the id, title or
        description of folders and/or corpora (default: empty).

    `make_`{`folder`,`corpus`}`_`{`id`,`title`,`description`}
    :   A function to use to make the id, title or description of a
        folder or corpus. The function takes the arguments `info` (the
        folder or corpus data in subfolder\_tree), `parent_folder`
        (settings.corporafolders subobject) and `ancestor_folder_ids`
        (an array of strings containing the ancestor folder ids from
        the top to the parent), and it should return a string. If
        defined, the function is used in preference to the prefix and
        suffix properties above.

#### Custom functions

Another complex example of using JavaScript to generate corpus
configurations is for the KLK corpora (National Library Newspapers and
Magazines, corpus ids `klk_`…), in which the variable part is
primarily the year, but also a different value for the property
`context` beginning from a certain year. In addition, JavaScript code
is used to generate corpus folders by decade. (However, the custom
function could probably be replaced with
`settings.fn.make_folder_hierarchy` and a function creating the folder
hierarchy.

### Corpus aliases

Corpus aliases are used to map a corpus id to another one or a list of
corpus ids. They can be used as shorthands for a list of corpus ids,
or to map old corpus ids of renamed corpora to new ones. The
shorthands are useful in the location URNs of corpora split to
multiple subcorpora in Korp, for example. For renamed corpora, they
allow saved URLs referring to old corpus ids to continue to work.
Corpus aliases are expanded in the URL, so the URL that the user sees
in the end contains the actual corpus ids. Please note that the corpus
alias mechanism works currently for the Korp frontend only. For the
backend (Korp API), you currently need to copy a renamed corpus to the
new name. An alias mechanism for the backend may be introduced later.
Corpus aliases are defined in the object (namespace)
`settings.corpus_aliases`. The property name is the alias, and the
value is string containing a list of comma-separated corpus ids or
regular expressions. Note that corpus aliases are not expanded
recursively, so the value should not refer to corpus aliases. For
example:

    // "las2" is expanded to the two corpora las2_tentit and las2_esseet
    settings.corpus_aliases.las2 = "las2_tentit,las2_esseet";

    // "lehdet_ks" has been renamed as "karjalansuomi", but allow the old id via an alias
    settings.corpus_aliases.lehdet_ks = "karjalansuomi";

    // "ftc" refers to the list of all the corpora whose id begins with "ftc_"
    settings.corpus_aliases.ftc = "ftc_.*";

Note that the expansions of aliases containing regular expressions may
change if new corpora are added to Korp. Such aliases may not be used
for the Korp URNs of corpora, since the denotation of a corpus URN
should be permanent.

### Special features of parallel corpus configurations

For parallel corpora, the configuration of the corpus for each
language is defined separately as above, but a couple of additional
properties are added to the configuration. One of the aligned corpora
is a kind of a main corpus that is shown in Korp’s corpus selector.
The property `contents` of a corpus folder lists only this main
corpus. In the configurations of individual corpora, the crucial
attributes are `lang`, `linked_to`, `context` and `hide`. They are
described in the comments of the following example:

    settings.corpora.parfin_2016_fi = {
        id: "parfin_2016_fi",
        title: "ParFin 2016",
        description: "ParFin 2016 – suomi–venäjä kaunokirjallisten tekstien rinnakkaiskorpus ...",
        // ..
        // The corpus language code (a three-letter ISO language code)
        lang: "fin",
        // Information on the structure on which the corpora have been aligned; the value may be
        // context.linkAligned if the alignment structure is "link", or context.defaultAligned
        // if it is "sentence". If the alignment element is something else, it must be defined in the
        // variable context.
        context: context.linkAligned,
        within: settings.sentLinkWithin,
        // The other parts of the parallel corpus which this corpus has been liked to and aligned with.
        linked_to: ["parfin_2016_ru"],
        attributes: attrlist.parfin_2016_fi,
        struct_attributes: sattrlist.parfin_2016_fi,
        // The main corpus should be shown in the corpus selector, so no property "hide"
    };

    settings.corpora.parfin_2016_ru = {
        id: "parfin_2016_ru",
        title: "ParFin 2016",
        description: "ParFin 2016 – suomi–venäjä kaunokirjallisten tekstien rinnakkaiskorpus ...",
        // ..
        lang: "rus",
        context: context.linkAligned,
        within: settings.sentLinkWithin,
        linked_to: ["parfin_2016_fi"],
        attributes: attrlist.parfin_2016_ru,
        struct_attributes: sattrlist.parfin_2016_ru,
        // Setting the property hide to true hides this corpus from the corpus selector, since this is not the main corpus.
        hide: true,
    };

### Generating corpus configuration with `korp-make-config`

Instead of writing the configuration for a corpus (completely) by
hand, you can use the script `scripts/korp-make-config` in the [GitHub
repository Kielipankki-utilities. It may be helpful when generating a
large number of similar configurations if you do not wish to generate
them with JavaScript code. However, the script does not (yet) support
many of the features available in corpus
configurations.](https://github.com/CSCfi/Kielipankki-utilities)

*\[TODO: Describe the usage of `korp-make-config`.\]*

## Adding attribute name and value translations to translations files

The texts shown for corpus attributes and their values are defined in
the JSON translation files `corpora-lg.json`, where lg is the language
code `fi`, `sv` or `en`. Many corpora have translations currently on
for Finnish, that is, in the file `translations/corpora-fi.json`.
However, Swedish-language corpora should have translations at least in
Swedish and corpora in other languages than Finnish or Swedish at
least in English. Translations in the JSON files are of the form

        "translation_key": "translation",

where translation\_key may be an attribute label (the value of the
property `label` in the configuration of a corpus attribute), or the
value of an enumerated attribute in the form prefixvalue, where prefix
is the value of the `translationKey` property of an attribute. For
example:

        "pos": "part-of-speech",

        "pos_A": "adjective",
        "pos_Abbr": "abbreviation",
        "pos_Adp": "adposition",

The following lists current best practices for translation keys and
translations. However, for historical reasons, the translation files
contain a large number of examples violating these practices.
-   Translation keys should be in English, correspond to the meaning
    of the attribute or attribute value, be human readable but
    reasonably short.
-   A translation should in general begin with a lower-case letter,
    unless it begins with a proper name.
-   Avoid structure and corpus names in the translation keys, unless
    they are part of the translation. For example, the translation key
    for the structural attribute `text_author` should be `author` and
    not `text_author`, unless the translation should be “author of the
    text”.
-   For the values of enumerated attributes, avoid annotation-specific
    translation keys, such as `pos_klk_A`. Instead, you could have
    `pos_Adj` and the `dataset` property of the attribute with the
    mapping `"A": "Adj"`.

If you add translations to the end of a translation file, please make
sure that every translation key–value pair *except the last one in the
file* ends in a comma. A comma missing from the end of a non-final
translation line or a comma at the end of a translation file causes
Korp not to work, with little or no indication of the place of error.

</div>
