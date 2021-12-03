
// List the corpora (corpus ids) matching the regular expression regex.
// The regular expression is implicitly anchored to the beginning and
// end, so a corpus id must match it completely. The optional second
// argument is an object for options. If the option "inverse" is true,
// list corpora not matching regex. If the option "sort" is true, sort
// the corpus ids alphabetically.

util.listMatchingCorpora = function(regex) {
    const corp_re = RegExp("^(" + regex + ")$");
    const opts = arguments.length > 1 ? arguments[1] : {};
    const {
        inverse
    } = opts;
    const result = [];
    for (let corpus in settings.corpora) {
        const match = corp_re.test(corpus);
        if ((match && !inverse) || (inverse && !match)) {
            result.push(corpus);
        }
    }
    if (opts.sort) {
        result.sort();
    }
    return result;
};


// Map possible corpus id aliases to actual corpus ids in the URL hash
// parameter "corpus". Aliases are defined in settings.corpus_aliases,
// whose property keys are aliases and values the actual corpus ids,
// separated by commas. The corpus ids may also be regular expressions
// that are expanded to the corpora mathing the regexp.
//
// Aliases can be useful if a corpus is renamed: the old name (id) can
// be retained as an alias to avoid breaking possible URLs containing
// the old id of the corpus. An alias may also be used a shorthand for
// a list of corpora. Regular expressions allow the denotation of the
// alias to expand if new corpora matching the regexp are added to Korp
// (or old ones removed). (Jyrki Niemi 2015-04-23, 2016-01-22)

util.mapHashCorpusAliases = function() {

    const getUrlParam = function(name) {
        const param_re = RegExp("\\b" + name + "=([^&;]*)");
        const matches = window.location.hash.match(param_re);
        if ((matches != null) && (matches.length > 1)) { return matches[1]; } else { return null; }
    };

    const expandAlias = function(alias) {
        if (/[^a-z0-9_,-]/.test(alias)) {
            let corpora = [];
            const corp_specs = alias.split(",");
            for (let corp_spec of corp_specs) {
                if (/[^a-z0-9_,-]/.test(corp_spec)) {
                    corpora = corpora.concat(
                        util.listMatchingCorpora(corp_spec));
                }
            }
            return corpora.join(",");
        } else {
            return alias;
        }
    };

    const mapCorpusAliasList = corpus => _.map(corpus.split(","),
          function(corpus_id) {
              if (corpus_id in settings.corpus_aliases) {
                  return expandAlias(settings.corpus_aliases[corpus_id]);
              } else {
                  return corpus_id;
              }
         })
    .join(",");

    if (settings.corpus_aliases != null) {
        const orig_corpus = getUrlParam("corpus");
        if (orig_corpus) {
            const corpus = mapCorpusAliasList(orig_corpus);
            if (corpus !== orig_corpus) {
                c.log("mapHashCorpusAliases", orig_corpus, "->", corpus);
                window.location.hash = window.location.hash.replace(
                    "corpus=" + orig_corpus, "corpus=" + corpus);
            }
        }
    }
};
