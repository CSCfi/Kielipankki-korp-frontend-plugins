(function() {
  var added_corpora_ids,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  window.util = {};

  window.CorpusListing = (function() {
    function CorpusListing(corpora) {
      this.struct = corpora;
      this.corpora = _.values(corpora);
      this.selected = _.filter(this.corpora, function(corp) {
        return !corp.limited_access;
      });
      this.ignore_between_tokens_cqp = this.updateIgnoreBetweenTokensCQP();
    }

    CorpusListing.prototype.get = function(key) {
      return this.struct[key];
    };

    CorpusListing.prototype.list = function() {
      return this.corpora;
    };

    CorpusListing.prototype.map = function(func) {
      return _.map(this.corpora, func);
    };

    CorpusListing.prototype.subsetFactory = function(idArray) {
      var cl;
      idArray = _.invoke(idArray, "toLowerCase");
      cl = new CorpusListing(_.pick.apply(_, [this.struct].concat(slice.call(idArray))));
      cl.selected = cl.corpora;
      return cl;
    };

    CorpusListing.prototype.getSelectedCorpora = function() {
      return corpusChooserInstance.corpusChooser("selectedItems");
    };

    CorpusListing.prototype.select = function(idArray) {
      c.log("CorpusListing.select", idArray);
      this.selected = _.values(_.pick.apply(this, [this.struct].concat(idArray)));
      this.updateIgnoreBetweenTokensCQP();
      c.log("CorpusListing.selected:", this.selected);
      return this.selected;
    };

    CorpusListing.prototype.mapSelectedCorpora = function(f) {
      return _.map(this.selected, f);
    };

    CorpusListing.prototype.getRestrictedCorpora = function() {
      return _(this.corpora).filter(function(corp) {
        return corp.limited_access;
      }).pluck("id").value();
    };

    CorpusListing.prototype.getTitles = function(corpora) {
      return _(corpora).map((function(_this) {
        return function(corp) {
          return _this.struct[corp];
        };
      })(this)).pluck("title").value();
    };

    CorpusListing.prototype._mapping_intersection = function(mappingArray) {
      return _.reduce(mappingArray, (function(a, b) {
        var keys_intersect, to_mergea, to_mergeb;
        keys_intersect = _.intersection(_.keys(a), _.keys(b));
        to_mergea = _.pick.apply(_, [a].concat(slice.call(keys_intersect)));
        to_mergeb = _.pick.apply(_, [b].concat(slice.call(keys_intersect)));
        return _.merge({}, to_mergea, to_mergeb);
      }) || {});
    };

    CorpusListing.prototype._mapping_union = function(mappingArray) {
      return _.reduce(mappingArray, (function(a, b) {
        return _.merge(a, b);
      }), {});
    };

    CorpusListing.prototype.getCurrentAttributes = function() {
      var attrs;
      attrs = this.mapSelectedCorpora(function(corpus) {
        return corpus.attributes;
      });
      return this._invalidateAttrs(attrs);
    };

    CorpusListing.prototype.getCurrentAttributesIntersection = function() {
      var attrs;
      attrs = this.mapSelectedCorpora(function(corpus) {
        return corpus.attributes;
      });
      return this._mapping_intersection(attrs);
    };

    CorpusListing.prototype.getStructAttrsIntersection = function() {
      var attrs;
      attrs = this.mapSelectedCorpora(function(corpus) {
        var key, ref, value;
        ref = corpus.struct_attributes;
        for (key in ref) {
          value = ref[key];
          value["isStructAttr"] = true;
        }
        return corpus.struct_attributes;
      });
      return this._mapping_intersection(attrs);
    };

    CorpusListing.prototype.getStructAttrs = function() {
      var attrs, rest, withDataset;
      attrs = this.mapSelectedCorpora(function(corpus) {
        var key, pos_attrs, ref, value;
        ref = corpus.struct_attributes;
        for (key in ref) {
          value = ref[key];
          value["isStructAttr"] = true;
        }
        pos_attrs = _.pick(corpus.attributes, function(val, key) {
          return val.isStructAttr;
        });
        return _.extend({}, pos_attrs, corpus.struct_attributes);
      });
      rest = this._invalidateAttrs(attrs);
      withDataset = _.filter(_.pairs(rest), function(item) {
        return item[1].dataset;
      });
      $.each(withDataset, function(i, item) {
        var key, val;
        key = item[0];
        val = item[1];
        return $.each(attrs, function(j, origStruct) {
          var ds, ref;
          if ((ref = origStruct[key]) != null ? ref.dataset : void 0) {
            ds = origStruct[key].dataset;
            if ($.isArray(ds)) {
              ds = _.object(ds, ds);
            }
            if (_.isArray(val.dataset)) {
              val.dataset = _.object(val.dataset, val.dataset);
            }
            return $.extend(val.dataset, ds);
          }
        });
      });
      return $.extend(rest, _.object(withDataset));
    };

    CorpusListing.prototype._invalidateAttrs = function(attrs) {
      var intersection, union;
      union = this._mapping_union(attrs);
      intersection = this._mapping_intersection(attrs);
      $.each(union, function(key, value) {
        if (intersection[key] == null) {
          return value["disabled"] = true;
        } else {
          return delete value["disabled"];
        }
      });
      return union;
    };

    CorpusListing.prototype.corpusHasAttrs = function(corpus, attrs) {
      var attr, k, len;
      for (k = 0, len = attrs.length; k < len; k++) {
        attr = attrs[k];
        if (!(attr === "word" || attr in $.extend({}, this.struct[corpus].attributes, this.struct[corpus].struct_attributes))) {
          return false;
        }
      }
      return true;
    };

    CorpusListing.prototype.stringifySelected = function() {
      return _(this.selected).pluck("id").invoke("toUpperCase").join(",");
    };

    CorpusListing.prototype.stringifyAll = function() {
      return _(this.corpora).pluck("id").invoke("toUpperCase").join(",");
    };

    CorpusListing.prototype.getWithinKeys = function() {
      var struct;
      struct = _.map(this.selected, function(corpus) {
        return _.keys(corpus.within);
      });
      return _.union.apply(_, struct);
    };

    CorpusListing.prototype.minimizeDefaultAndCorpusQueryString = function(type, params) {
      var all_corpora, corp, corpname, corpora, corpval, default_corpora, default_val, k, l, len, len1, lengths, lensum, maxval, nondefault_corpora, other_vals, ref, ref1, val, value_corpora;
      if (!((params.corpus != null) && params[type])) {
        return params;
      }
      all_corpora = params.corpus.split(',');
      c.log('minimize', type, params.corpus, params['default' + type], params[type], params[type].length);
      default_val = params['default' + type];
      value_corpora = {};
      nondefault_corpora = [];
      ref = params[type].split(',');
      for (k = 0, len = ref.length; k < len; k++) {
        corpval = ref[k];
        ref1 = corpval.split(':'), corpname = ref1[0], val = ref1[1];
        if (value_corpora[val] == null) {
          value_corpora[val] = [];
        }
        value_corpora[val].push(corpname);
        nondefault_corpora.push(corpname);
      }
      default_corpora = _.difference(all_corpora, nondefault_corpora);
      value_corpora[default_val] = (value_corpora[default_val] || []).concat(default_corpora);
      lengths = [];
      for (val in value_corpora) {
        corpora = value_corpora[val];
        lensum = 0;
        for (l = 0, len1 = corpora.length; l < len1; l++) {
          corp = corpora[l];
          lensum += corp.length;
        }
        lengths.push({
          value: val,
          length: lensum + (corpora.length * (val.length + 6)) - (corpora.length === 1 ? 3 : 0)
        });
      }
      maxval = _.max(lengths, 'length').value;
      c.log('minimizing', type, value_corpora, lengths, maxval);
      if (maxval === default_val && default_corpora.length > 0) {
        return params;
      }
      params['default' + type] = maxval;
      other_vals = [];
      for (val in value_corpora) {
        corpora = value_corpora[val];
        if (val !== maxval) {
          other_vals = other_vals.concat([
            (function() {
              var len2, m, results;
              results = [];
              for (m = 0, len2 = corpora.length; m < len2; m++) {
                corp = corpora[m];
                results.push(corp + ':' + val);
              }
              return results;
            })()
          ]);
        }
      }
      params[type] = other_vals.join(',');
      c.log('minimized', type, params['default' + type], params[type], params[type].length);
      if (params[type] === '') {
        delete params[type];
      }
      return params;
    };

    CorpusListing.prototype.minimizeWithinQueryString = function(params) {
      return this.minimizeDefaultAndCorpusQueryString('within', params);
    };

    CorpusListing.prototype.minimizeContextQueryString = function(params) {
      return this.minimizeDefaultAndCorpusQueryString('context', params);
    };

    CorpusListing.prototype.getContextQueryString = function(prefer, avoid) {
      var contexts, corpus, output;
      output = (function() {
        var k, len, ref, results;
        ref = this.selected;
        results = [];
        for (k = 0, len = ref.length; k < len; k++) {
          corpus = ref[k];
          contexts = _.keys(corpus.context);
          if (indexOf.call(contexts, prefer) < 0) {
            if (contexts.length > 1 && indexOf.call(contexts, avoid) >= 0) {
              contexts.splice(contexts.indexOf(avoid), 1);
            }
            results.push(corpus.id.toUpperCase() + ":" + contexts[0]);
          } else {
            results.push(void 0);
          }
        }
        return results;
      }).call(this);
      return _(output).compact().join();
    };

    CorpusListing.prototype.getWithinParameters = function() {
      var corpus, defaultWithin, output, within, withins;
      defaultWithin = search().within || _.keys(settings.defaultWithin)[0];
      output = (function() {
        var k, len, ref, results;
        ref = this.selected;
        results = [];
        for (k = 0, len = ref.length; k < len; k++) {
          corpus = ref[k];
          withins = _.keys(corpus.within);
          if (indexOf.call(withins, defaultWithin) < 0) {
            results.push(corpus.id.toUpperCase() + ":" + withins[0]);
          } else {
            results.push(void 0);
          }
        }
        return results;
      }).call(this);
      within = _(output).compact().join();
      return {
        defaultwithin: defaultWithin,
        within: within
      };
    };

    CorpusListing.prototype.getWithinQueryString = function() {
      var corpus, output, prefer_within;
      prefer_within = search().within;
      if (prefer_within && !(prefer_within in settings.defaultWithin)) {
        output = (function() {
          var k, len, ref, results;
          ref = this.selected;
          results = [];
          for (k = 0, len = ref.length; k < len; k++) {
            corpus = ref[k];
            if (prefer_within in corpus.within) {
              results.push(corpus.id.toUpperCase() + ":" + prefer_within);
            } else {
              results.push(false);
            }
          }
          return results;
        }).call(this);
        return _(output).flatten().compact().join();
      } else {
        return null;
      }
    };

    CorpusListing.prototype.getMorphology = function() {
      return _(this.selected).map(function(corpus) {
        var morf;
        morf = corpus.morf || "saldom";
        return morf.split("|");
      }).flatten().unique().join("|");
    };

    CorpusListing.prototype.getTimeInterval = function() {
      var all;
      all = _(this.selected).pluck("time").filter(function(item) {
        return item != null;
      }).map(_.keys).flatten().map(Number).sort(function(a, b) {
        return a - b;
      }).value();
      return [_.first(all), _.last(all)];
    };

    CorpusListing.prototype.getMomentInterval = function() {
      var from, froms, infoGetter, to, toUnix, tos;
      toUnix = function(item) {
        return item.unix();
      };
      infoGetter = (function(_this) {
        return function(prop) {
          return _(_this.selected).pluck("info").pluck(prop).compact().map(function(item) {
            return moment(item);
          }).value();
        };
      })(this);
      froms = infoGetter("FirstDate");
      tos = infoGetter("LastDate");
      if (!froms.length) {
        from = null;
      } else {
        from = _.min(froms, toUnix);
      }
      if (!tos.length) {
        to = null;
      } else {
        to = _.max(tos, toUnix);
      }
      return [from, to];
    };

    CorpusListing.prototype.getNonProtected = function() {
      return _.filter(this.corpora, function(item) {
        return !item.limited_access;
      });
    };

    CorpusListing.prototype.getTitle = function(corpus) {
      var e;
      try {
        return this.struct[corpus].title;
      } catch (_error) {
        e = _error;
        return c.log("gettitle broken", corpus);
      }
    };

    CorpusListing.prototype.getAttributeGroups = function(lang) {
      var attrs, common, common_keys, key, obj, sent_attrs, word;
      word = {
        group: "word",
        value: "word",
        label: "word"
      };
      attrs = (function() {
        var ref, results;
        ref = this.getCurrentAttributes(lang);
        results = [];
        for (key in ref) {
          obj = ref[key];
          if (obj.displayType !== "hidden" && obj.displayOnly !== "sidebar") {
            results.push(_.extend({
              group: "word_attr",
              value: key
            }, obj));
          }
        }
        return results;
      }).call(this);
      common_keys = _.compact(_.flatten(_.map(this.selected, function(corp) {
        return _.keys(corp.common_attributes);
      })));
      common = _.pick.apply(_, [settings.common_struct_types].concat(slice.call(common_keys)));
      sent_attrs = (function() {
        var ref, results;
        ref = _.extend({}, common, this.getStructAttrs(lang));
        results = [];
        for (key in ref) {
          obj = ref[key];
          if (obj.displayType !== "hidden" && obj.displayOnly !== "sidebar") {
            results.push(_.extend({
              group: "sentence_attr",
              value: key
            }, obj));
          }
        }
        return results;
      }).call(this);
      sent_attrs = _.sortBy(sent_attrs, function(item) {
        return util.getLocaleString(item.label);
      });
      return [word].concat(attrs, sent_attrs);
    };

    CorpusListing.prototype.updateIgnoreBetweenTokensCQP = function() {
      var ignore_cqps;
      ignore_cqps = _(this.selected).pluck("ignore_between_tokens_cqp").uniq().value();
      this.ignore_between_tokens_cqp = ignore_cqps.length === 1 ? ignore_cqps[0] : "";
      c.log("ignore_between_tokens_cqp", this.ignore_between_tokens_cqp);
      return this.ignore_between_tokens_cqp;
    };

    CorpusListing.prototype.addIgnoreBetweenTokensCQP = function(cqp, force) {
      if (force == null) {
        force = false;
      }
      if (this.ignore_between_tokens_cqp && (force || Number(search().search_tab) === 1)) {
        cqp = this.insertBetweenCQPTokens(cqp, this.ignore_between_tokens_cqp);
        c.log("addIgnoreCQPBetweenTokens after:", cqp);
      }
      return cqp;
    };

    CorpusListing.prototype.insertBetweenCQPTokens = function(base_cqp, insert_cqp) {
      var cqp_tokens, last_token_num, result, token, token_num;
      cqp_tokens = base_cqp.match(/\[([^\]\"\']*("([^\\\"]|\\.)*"|'([^\\\']|\\.)*'))*[^\]\"\']*\]|([^\[]+)/g);
      last_token_num = _(cqp_tokens).map(function(token) {
        return token.charAt(0) === "[";
      }).lastIndexOf(true);
      result = (function() {
        var k, len, results;
        results = [];
        for (token_num = k = 0, len = cqp_tokens.length; k < len; token_num = ++k) {
          token = cqp_tokens[token_num];
          if (token.charAt(0) === "[" && token_num < last_token_num) {
            results.push("(" + token + " " + insert_cqp + ")");
          } else {
            results.push(token);
          }
        }
        return results;
      })();
      return result.join("");
    };

    return CorpusListing;

  })();

  window.ParallelCorpusListing = (function(superClass) {
    extend(ParallelCorpusListing, superClass);

    function ParallelCorpusListing(corpora) {
      ParallelCorpusListing.__super__.constructor.call(this, corpora);
    }

    ParallelCorpusListing.prototype.select = function(idArray) {
      this.selected = [];
      $.each(idArray, (function(_this) {
        return function(i, id) {
          var corp;
          corp = _this.struct[id];
          return _this.selected = _this.selected.concat(_this.getLinked(corp, true, false));
        };
      })(this));
      return this.selected = _.unique(this.selected);
    };

    ParallelCorpusListing.prototype.setActiveLangs = function(langlist) {
      return this.activeLangs = langlist;
    };

    ParallelCorpusListing.prototype.getCurrentAttributes = function(lang) {
      var corpora, struct;
      corpora = _.filter(this.selected, function(item) {
        return item.lang === lang;
      });
      struct = _.reduce(corpora, function(a, b) {
        return $.extend({}, a.attributes, b.attributes);
      }, {});
      return struct;
    };

    ParallelCorpusListing.prototype.getStructAttrs = function(lang) {
      var corpora, struct;
      corpora = _.filter(this.selected, function(item) {
        return item.lang === lang;
      });
      struct = _.reduce(corpora, function(a, b) {
        return $.extend({}, a.struct_attributes, b.struct_attributes);
      }, {});
      $.each(struct, function(key, val) {
        return val["isStructAttr"] = true;
      });
      return struct;
    };

    ParallelCorpusListing.prototype.getLinked = function(corp, andSelf, only_selected) {
      var output, target;
      if (andSelf == null) {
        andSelf = false;
      }
      if (only_selected == null) {
        only_selected = true;
      }
      target = only_selected ? this.selected : this.struct;
      output = _.filter(target, function(item) {
        var ref;
        return ref = item.id, indexOf.call(corp.linked_to || [], ref) >= 0;
      });
      if (andSelf) {
        output = [corp].concat(output);
      }
      return output;
    };

    ParallelCorpusListing.prototype.getEnabledByLang = function(lang, andSelf, flatten) {
      var corps, output;
      if (andSelf == null) {
        andSelf = false;
      }
      if (flatten == null) {
        flatten = true;
      }
      corps = _.filter(this.selected, function(item) {
        return item["lang"] === lang;
      });
      output = _(corps).map((function(_this) {
        return function(item) {
          return _this.getLinked(item, andSelf);
        };
      })(this)).value();
      if (flatten) {
        return _.flatten(output);
      } else {
        return output;
      }
    };

    ParallelCorpusListing.prototype.getLinksFromLangs = function(activeLangs) {
      var cps, k, l, lang, len, len1, linked, main, other, output, ref;
      if (activeLangs.length === 1) {
        return this.getEnabledByLang(activeLangs[0], true, false);
      }
      main = _.filter(this.selected, function(corp) {
        return corp.lang === activeLangs[0];
      });
      output = [];
      ref = activeLangs.slice(1);
      for (k = 0, len = ref.length; k < len; k++) {
        lang = ref[k];
        other = _.filter(this.selected, function(corp) {
          return corp.lang === lang;
        });
        for (l = 0, len1 = other.length; l < len1; l++) {
          cps = other[l];
          linked = _(main).filter(function(mainCorpus) {
            var ref1;
            return ref1 = cps.id, indexOf.call(mainCorpus.linked_to, ref1) >= 0;
          }).value();
          output = output.concat(_.map(linked, function(item) {
            return [item, cps];
          }));
        }
      }
      return output;
    };

    ParallelCorpusListing.prototype.stringifySelected = function(onlyMain) {
      var i, item, k, len, main, output, pair, struct;
      struct = this.getLinksFromLangs(this.activeLangs);
      if (onlyMain) {
        struct = _.map(struct, (function(_this) {
          return function(pair) {
            return _.filter(pair, function(item) {
              return item.lang === _this.activeLangs[0];
            });
          };
        })(this));
        return _(struct).flatten().pluck("id").invoke("toUpperCase").join(",");
      }
      c.log("struct", struct);
      output = [];
      for (i = k = 0, len = struct.length; k < len; i = ++k) {
        item = struct[i];
        main = item[0];
        pair = _.map(item.slice(1), function(corp) {
          return main.id.toUpperCase() + "|" + corp.id.toUpperCase();
        });
        output.push(pair);
      }
      return output.join(",");
    };

    ParallelCorpusListing.prototype.getTitle = function(corpus) {
      return this.struct[corpus.split("|")[1]].title;
    };

    return ParallelCorpusListing;

  })(CorpusListing);

  settings.corpusListing = new CorpusListing(settings.corpora);

  window.applyTo = function(ctrl, f) {
    var s;
    s = getScope(ctrl);
    return s.$apply(f(s));
  };

  window.search = function(obj, val) {
    var ret, s;
    s = $("body").scope();
    ret = safeApply(s.$root, function() {
      if (!obj) {
        return s.$root.search();
      }
      if (_.isObject(obj)) {
        obj = _.extend({}, s.$root.search(), obj);
        return s.$root.search(obj);
      } else {
        return s.$root.search(obj, val);
      }
    });
    if (val === null) {
      onHashChange();
    }
    return ret;
  };

  window.initLocales = function() {
    var def, defs, fn1, k, l, lang, len, len1, packages, pkg, prefix, ref;
    packages = ["locale", "corpora"];
    prefix = "translations";
    defs = [];
    window.loc_data = {};
    def = $.Deferred();
    ref = settings.languages;
    for (k = 0, len = ref.length; k < len; k++) {
      lang = ref[k];
      loc_data[lang] = {};
      fn1 = function(lang, pkg) {
        var file;
        file = pkg + "-" + lang + '.json';
        file = prefix + "/" + file;
        return defs.push($.ajax({
          url: file,
          dataType: "json",
          cache: false,
          success: function(data) {
            return _.extend(loc_data[lang], data);
          }
        }));
      };
      for (l = 0, len1 = packages.length; l < len1; l++) {
        pkg = packages[l];
        fn1(lang, pkg);
      }
    }
    $.when.apply($, defs).then(function() {
      return def.resolve(loc_data);
    });
    return def;
  };

  util.addDefaultTranslations = function() {
    var all_keys, k, key, l, lang, lang2, len, len1, len2, loc_data, m, ref, ref1;
    if ((settings.defaultTranslations == null) || settings.defaultTranslations.length === 0) {
      return;
    }
    loc_data = window.loc_data;
    all_keys = _(loc_data).map(_.keys).flatten().uniq().value();
    ref = settings.languages;
    for (k = 0, len = ref.length; k < len; k++) {
      lang = ref[k];
      for (l = 0, len1 = all_keys.length; l < len1; l++) {
        key = all_keys[l];
        if (!(key in loc_data[lang])) {
          ref1 = settings.defaultTranslations;
          for (m = 0, len2 = ref1.length; m < len2; m++) {
            lang2 = ref1[m];
            if (lang2 !== lang) {
              if (lang2 === 'KEY') {
                loc_data[lang][key] = key;
                break;
              } else if (key in loc_data[lang2]) {
                loc_data[lang][key] = loc_data[lang2][key];
                break;
              }
            }
          }
        }
      }
    }
  };

  window.safeApply = function(scope, fn) {
    if (scope.$$phase || scope.$root.$$phase) {
      return fn(scope);
    } else {
      return scope.$apply(fn);
    }
  };

  window.util.setLogin = function() {
    var corp, k, len, ref;
    $("body").toggleClass("logged_in not_logged_in");
    ref = authenticationProxy.loginObj.credentials;
    for (k = 0, len = ref.length; k < len; k++) {
      corp = ref[k];
      $("#hpcorpus_" + (corp.toLowerCase())).closest(".boxdiv.disabled").removeClass("disabled");
    }
    if (window.corpusChooserInstance) {
      window.corpusChooserInstance.corpusChooser("updateAllStates");
    }
    $("#log_out .usrname").text(authenticationProxy.loginObj.name);
    return $(".err_msg", self).hide();
  };

  util.SelectionManager = function() {
    this.selected = $();
    this.aux = $();
  };

  util.SelectionManager.prototype.select = function(word, aux) {
    if ((word == null) || !word.length) {
      return;
    }
    if (this.selected.length) {
      this.selected.removeClass("word_selected token_selected");
      this.aux.removeClass("word_selected aux_selected");
    }
    this.selected = word;
    this.aux = aux || $();
    this.aux.addClass("word_selected aux_selected");
    return word.addClass("word_selected token_selected");
  };

  util.SelectionManager.prototype.deselect = function() {
    if (!this.selected.length) {
      return;
    }
    this.selected.removeClass("word_selected token_selected");
    this.selected = $();
    this.aux.removeClass("word_selected aux_selected");
    this.aux = $();
  };

  util.SelectionManager.prototype.hasSelected = function() {
    return this.selected.length > 0;
  };

  util.getLocaleString = function(key, lang) {
    var e;
    if (!lang) {
      lang = window.lang || settings.defaultLanguage || "sv";
    }
    try {
      return loc_data[lang][key] || key;
    } catch (_error) {
      e = _error;
      return key;
    }
  };

  util.localize = function(root) {
    root = root || "body";
    $(root).localize();
  };

  util.lemgramToString = function(lemgram, appendIndex) {
    var concept, infixIndex, match, type;
    lemgram = _.str.trim(lemgram);
    infixIndex = "";
    concept = lemgram;
    infixIndex = "";
    type = "";
    if (util.isLemgramId(lemgram)) {
      match = util.splitLemgram(lemgram);
      if ((appendIndex != null) && match.index !== "1") {
        infixIndex = $.format("<sup>%s</sup>", match.index);
      }
      concept = match.form.replace(/_/g, " ");
      type = match.pos.slice(0, 2);
    }
    return $.format("%s%s <span class='wordclass_suffix'>(<span rel='localize[%s]'>%s</span>)</span>", [concept, infixIndex, type, util.getLocaleString(type)]);
  };

  util.saldoRegExp = /(.*?)\.\.(\d\d?)(\:\d+)?$/;

  util.saldoToString = function(saldoId, appendIndex) {
    var infixIndex, match;
    match = saldoId.match(util.saldoRegExp);
    infixIndex = "";
    if ((appendIndex != null) && match[2] !== "1") {
      infixIndex = $.format("<sup>%s</sup>", match[2]);
    }
    return $.format("%s%s", [match[1].replace(/_/g, " "), infixIndex]);
  };

  util.sblexArraytoString = function(idArray, labelFunction) {
    labelFunction = labelFunction || util.lemgramToString;
    return _.map(idArray, function(lemgram) {
      return labelFunction(lemgram, true);
    });
  };

  util.lemgramRegexp = /\.\.\w+\.\d\d?(\:\d+)?$/;

  util.isLemgramId = function(lemgram) {
    return lemgram.search(util.lemgramRegexp) !== -1;
  };

  util.splitLemgram = function(lemgram) {
    var keys, splitArray;
    if (!util.isLemgramId(lemgram)) {
      throw new Error("Input to util.splitLemgram is not a lemgram: " + lemgram);
    }
    keys = ["morph", "form", "pos", "index", "startIndex"];
    splitArray = lemgram.match(/((\w+)--)?(.*?)\.\.(\w+)\.(\d\d?)(\:\d+)?$/).slice(2);
    return _.object(keys, splitArray);
  };

  util.splitSaldo = function(saldo) {
    return saldo.match(util.saldoRegExp);
  };

  util.setDownloadLinks = function(xhr_settings, result_data) {
    var corpus_id, corpus_ids, download_params, format, get_corpus_num, i, j, link_id, result_corpora, result_corpora_settings;
    if (!((xhr_settings != null) && (result_data != null) && (result_data.corpus_order != null) && (result_data.kwic != null))) {
      c.log('failed to do setDownloadLinks');
      return;
    }
    get_corpus_num = function(hit_num) {
      return result_data.corpus_order.indexOf(result_data.kwic[hit_num].corpus);
    };
    c.log('setDownloadLinks data:', result_data);
    $('#download-links').empty();
    result_corpora = result_data.corpus_order.slice(get_corpus_num(0), get_corpus_num(result_data.kwic.length - 1) + 1);
    result_corpora_settings = {};
    i = 0;
    while (i < result_corpora.length) {
      corpus_ids = result_corpora[i].toLowerCase().split('|');
      j = 0;
      while (j < corpus_ids.length) {
        corpus_id = corpus_ids[j];
        result_corpora_settings[corpus_id] = settings.corpora[corpus_id];
        j++;
      }
      i++;
    }
    i = 0;
    while (i < settings.downloadFormats.length) {
      format = settings.downloadFormats[i];
      link_id = format + '-link';
      $('#download-links').append('<a href="javascript:" ' + ' id="' + link_id + '"' + ' title="' + format + '"' + ' rel="localize[formatdescr_' + format + ']"' + ' class="download_link"><img src="img/' + format + '.png" alt="' + format.toUpperCase() + '" /></a>');
      download_params = {
        query_params: JSON.stringify($.deparam.querystring(xhr_settings.url)),
        format: format,
        korp_url: window.location.href,
        korp_server_url: settings.cgi_script,
        corpus_config: JSON.stringify(result_corpora_settings, function(key, value) {
          if (key === "logical_corpus") {
            return value.title;
          } else {
            return value;
          }
        }),
        corpus_config_info_keys: (settings.corpusExtraInfoItems || []).join(','),
        urn_resolver: settings.urnResolver
      };
      if ('downloadFormatParams' in settings) {
        if ('*' in settings.downloadFormatParams) {
          $.extend(download_params, settings.downloadFormatParams['*']);
        }
        if (format in settings.downloadFormatParams) {
          $.extend(download_params, settings.downloadFormatParams[format]);
        }
      }
      $('#' + link_id).click((function(params) {
        return function(e) {
          $.generateFile(settings.download_cgi_script, params);
          e.preventDefault();
        };
      })(download_params));
      i++;
    }
    $('#download-links').localize();
  };

  util.searchHash = function(type, value) {
    search({
      search: type + "|" + value,
      page: 0
    });
  };

  added_corpora_ids = [];

  util.loadCorporaFolderRecursive = function(first_level, folder) {
    var cont, folder_descr, format_licence_type, outHTML, usedid, val;
    format_licence_type = function(corpus_id) {
      var licence_type;
      licence_type = settings.corpora[corpus_id]["licence_type"];
      if (licence_type) {
        return " [" + licence_type.toUpperCase() + "]";
      } else {
        return "";
      }
    };
    outHTML = void 0;
    if (first_level) {
      outHTML = "<ul>";
    } else {
      folder_descr = (folder.description || "") + (folder.info && settings.corpusExtraInfo ? (folder.description ? "<br/><br/>" : "") + util.formatCorpusExtraInfo(folder.info, settings.corpusExtraInfo.corpus_infobox) : "");
      outHTML = "<ul title=\"" + folder.title + "\" description=\"" + escape(folder_descr) + "\">";
    }
    if (folder) {
      $.each(folder, function(fol, folVal) {
        if (fol !== "contents" && fol !== "title" && fol !== "description" && fol !== "info") {
          outHTML += "<li>" + util.loadCorporaFolderRecursive(false, folVal) + "</li>";
        }
      });
      if (folder["contents"] && folder["contents"].length > 0) {
        $.each(folder.contents, function(key, value) {
          outHTML += "<li id=\"" + value + "\">" + settings.corpora[value]["title"] + format_licence_type(value) + "</li>";
          added_corpora_ids.push(value);
        });
      }
    }
    if (first_level) {
      for (val in settings.corpora) {
        cont = false;
        for (usedid in added_corpora_ids) {
          if (added_corpora_ids[usedid] === val || settings.corpora[val].hide) {
            cont = true;
          }
        }
        if (cont) {
          continue;
        }
        outHTML += "<li id='" + val + "'>" + (settings.corpora[val].title + format_licence_type(val)) + "</li>";
      }
    }
    outHTML += "</ul>";
    return outHTML;
  };

  util.prettyNumbers = function(numstring) {
    var outStrNum, regex;
    regex = /(\d+)(\d{3})/;
    outStrNum = numstring.toString();
    while (regex.test(outStrNum)) {
      outStrNum = outStrNum.replace(regex, "$1" + "<span rel=\"localize[util_numbergroupseparator]\">" + util.getLocaleString("util_numbergroupseparator") + "</span>" + "$2");
    }
    return outStrNum;
  };

  util.suffixedNumbers = function(num) {
    var out;
    out = "";
    if (num < 1000) {
      out = num.toString();
    } else if ((1000 <= num && num < 1e6)) {
      out = (num / 1000).toFixed(2).toString() + "K";
    } else if ((1e6 <= num && num < 1e9)) {
      out = (num / 1e6).toFixed(2).toString() + "M";
    } else if ((1e9 <= num && num < 1e12)) {
      out = (num / 1e9).toFixed(2).toString() + "G";
    } else if (1e12 <= num) {
      out = (num / 1e12).toFixed(2).toString() + "T";
    }
    return out.replace(".", "<span rel=\"localize[util_decimalseparator]\">" + util.getLocaleString("util_decimalseparator") + "</span>");
  };

  util.loadCorpora = function() {
    var outStr, selected;
    added_corpora_ids = [];
    outStr = util.loadCorporaFolderRecursive(true, settings.corporafolders);
    window.corpusChooserInstance = $("#corpusbox").corpusChooser({
      template: outStr,
      infoPopup: function(corpusID) {
        var baseLang, baseLangSentenceHTML, baseLangTokenHTML, baseLangs, corpusExtraInfo, corpusObj, k, lang, lastUpdate, len, maybeInfo, numSentences, numTokens, output, ref, sentenceString, supportsContext;
        corpusObj = settings.corpora[corpusID];
        maybeInfo = "";
        if (corpusObj.description) {
          maybeInfo = "<br/><br/>" + corpusObj.description;
        }
        corpusExtraInfo = settings.corpusExtraInfo ? util.formatCorpusExtraInfo(corpusObj, settings.corpusExtraInfo.corpus_infobox) : void 0;
        if (corpusExtraInfo) {
          maybeInfo += (maybeInfo ? "<br/><br/>" : "") + corpusExtraInfo;
        }
        numTokens = corpusObj.info.Size;
        baseLangTokenHTML = "";
        baseLangSentenceHTML = "";
        baseLangs = (ref = settings.corpora[corpusID]) != null ? ref.linked_to : void 0;
        if (baseLangs) {
          lang = " (" + util.getLocaleString(settings.corpora[corpusID].lang) + ")";
          for (k = 0, len = baseLangs.length; k < len; k++) {
            baseLang = baseLangs[k];
            baseLangTokenHTML += (util.getLocaleString("corpselector_numberoftokens")) + ": <b>" + (util.prettyNumbers(settings.corpora[baseLang].info.Size)) + "\n</b> (" + (util.getLocaleString(settings.corpora[baseLang].lang)) + ")<br/>";
            baseLangSentenceHTML += (util.getLocaleString("corpselector_numberofsentences")) + ": <b>" + (util.prettyNumbers(settings.corpora[baseLang].info.Sentences)) + "\n</b> (" + (util.getLocaleString(settings.corpora[baseLang].lang)) + ")<br/>";
          }
        } else {
          lang = "";
        }
        numSentences = corpusObj["info"]["Sentences"];
        lastUpdate = corpusObj["info"]["Updated"];
        if (!lastUpdate) {
          lastUpdate = "?";
        }
        sentenceString = "-";
        if (numSentences) {
          sentenceString = util.prettyNumbers(numSentences.toString());
        }
        output = "<b>\n    <img class=\"popup_icon\" src=\"img/korp_icon.png\" />\n    " + corpusObj.title + "\n</b>\n" + maybeInfo + "\n<br/><br/>" + baseLangTokenHTML + "\n" + (util.getLocaleString("corpselector_numberoftokens")) + ":\n<b>" + (util.prettyNumbers(numTokens)) + "</b>" + lang + "\n<br/>" + baseLangSentenceHTML + "\n" + (util.getLocaleString("corpselector_numberofsentences")) + ": \n<b>" + sentenceString + "</b>" + lang + "\n<br/>\n" + (util.getLocaleString("corpselector_lastupdate")) + ": \n<b>" + lastUpdate + "</b>\n<br/><br/>";
        supportsContext = _.keys(corpusObj.context).length > 1;
        if (supportsContext) {
          output += $("<div>").localeKey("corpselector_supports").html() + "<br>";
        }
        if (corpusObj.limited_access) {
          output += $("<div>").localeKey("corpselector_limited").html();
        }
        return output;
      },
      infoPopupFolder: function(indata) {
        var corporaID, desc, glueString, maybeInfo, missingSentenceData, totalSentences, totalSentencesString, totalTokens;
        corporaID = indata.corporaID;
        desc = indata.description;
        totalTokens = 0;
        totalSentences = 0;
        missingSentenceData = false;
        $(corporaID).each(function(key, oneID) {
          var oneCorpusSentences;
          totalTokens += parseInt(settings.corpora[oneID]["info"]["Size"]);
          oneCorpusSentences = settings.corpora[oneID]["info"]["Sentences"];
          if (oneCorpusSentences) {
            totalSentences += parseInt(oneCorpusSentences);
          } else {
            missingSentenceData = true;
          }
        });
        totalSentencesString = util.prettyNumbers(totalSentences.toString());
        if (missingSentenceData) {
          totalSentencesString += "+";
        }
        maybeInfo = "";
        if (desc && desc !== "") {
          maybeInfo = desc + "<br/><br/>";
        }
        glueString = "";
        if (corporaID.length === 1) {
          glueString = util.getLocaleString("corpselector_corporawith_sing");
        } else {
          glueString = util.getLocaleString("corpselector_corporawith_plur");
        }
        return "<b><img src=\"img/folder.png\" style=\"margin-right:4px; vertical-align:middle; margin-top:-1px\"/>" + indata.title + "</b><br/><br/>" + maybeInfo + "<b>" + corporaID.length + "</b> " + glueString + ":<br/><br/><b>" + util.prettyNumbers(totalTokens.toString()) + "</b> " + util.getLocaleString("corpselector_tokens") + "<br/><b>" + totalSentencesString + "</b> " + util.getLocaleString("corpselector_sentences");
      }
    }).bind("corpuschooserchange", function(evt, corpora) {
      c.log("corpuschooserchange", corpora);
      safeApply($("body").scope(), function(scope) {
        scope.$broadcast("corpuschooserchange", corpora);
      });
    });
    selected = corpusChooserInstance.corpusChooser("selectedItems");
    settings.corpusListing.select(selected);
  };

  window.regescape = function(s) {
    return s.replace(/[\\.|?+*\'\"()^${}\[\]]/g, "\\$&");
  };

  util.localizeFloat = function(float, nDec) {
    var lang, sep;
    lang = $("#languages").radioList("getSelected").data("lang");
    sep = null;
    nDec = nDec || float.toString().split(".")[1].length;
    sep = util.getLocaleString("util_decimalseparator");
    return $.format("%." + nDec + "f", float).replace(".", sep);
  };

  util.formatDecimalString = function(x, mode, statsmode, stringOnly) {
    var decimalSeparator, parts;
    if (_.contains(x, ".")) {
      parts = x.split(".");
      decimalSeparator = util.getLocaleString("util_decimalseparator");
      if (stringOnly) {
        return parts[0] + decimalSeparator + parts[1];
      }
      if (mode) {
        return util.prettyNumbers(parts[0]) + "<span rel=\"localize[util_decimalseparator]\">" + decimalSeparator + "</span>" + parts[1];
      } else {
        return util.prettyNumbers(parts[0]) + decimalSeparator + parts[1];
      }
    } else {
      if (statsmode) {
        return x;
      } else {
        return util.prettyNumbers(x);
      }
    }
  };

  util.makeAttrSelect = function(groups) {
    var arg_select;
    arg_select = $("<select/>");
    $.each(groups, function(lbl, group) {
      var optgroup;
      if ($.isEmptyObject(group)) {
        return;
      }
      optgroup = $("<optgroup/>", {
        label: util.getLocaleString(lbl).toLowerCase(),
        rel: $.format("localize[%s]", lbl)
      }).appendTo(arg_select);
      $.each(group, function(key, val) {
        if (val.displayType === "hidden") {
          return;
        }
        $("<option/>", {
          rel: $.format("localize[%s]", val.label)
        }).val(key).text(util.getLocaleString(val.label) || "").appendTo(optgroup).data("dataProvider", val);
      });
    });
    return arg_select;
  };

  util.browserWarn = function() {
    $.reject({
      reject: {
        msie5: true,
        msie6: true,
        msie7: true,
        msie8: true,
        msie9: true
      },
      imagePath: "img/browsers/",
      display: ["firefox", "chrome", "safari", "opera"],
      browserInfo: {
        firefox: {
          text: "Firefox",
          url: "http://www.mozilla.com/firefox/"
        },
        safari: {
          text: "Safari",
          url: "http://www.apple.com/safari/download/"
        },
        opera: {
          text: "Opera",
          url: "http://www.opera.com/download/"
        },
        chrome: {
          text: "Chrome",
          url: "http://www.google.com/chrome/"
        },
        msie: {
          text: "Internet Explorer",
          url: "http://www.microsoft.com/windows/Internet-explorer/"
        }
      },
      header: "Du använder en omodern webbläsare",
      paragraph1: "Korp använder sig av moderna webbteknologier som inte stödjs av din webbläsare. En lista på de mest populära moderna alternativen visas nedan. Firefox rekommenderas varmt.",
      paragraph2: "",
      closeMessage: "Du kan fortsätta ändå – all funktionalitet är densamma – men så fort du önskar att Korp vore snyggare och snabbare är det bara att installera Firefox, det tar bara en minut.",
      closeLink: "Stäng varningen",
      closeCookie: true,
      cookieSettings: {
        path: "/",
        expires: 100000
      }
    });
  };

  util.convertLMFFeatsToObjects = function(structure, key) {
    var dArr, output, theType;
    if (structure != null) {
      output = null;
      theType = util.findoutType(structure);
      if (theType === "object") {
        output = {};
        $.each(structure, function(inkey, inval) {
          var innerType, keyName;
          if (inkey === "feat") {
            innerType = util.findoutType(inval);
            if (innerType === "array") {
              $.each(inval, function(fkey, fval) {
                var keyName;
                keyName = "feat_" + fval["att"];
                if (output[keyName] == null) {
                  output[keyName] = fval["val"];
                } else {
                  if ($.isArray(output[keyName])) {
                    output[keyName].push(fval["val"]);
                  } else {
                    output[keyName] = [output[keyName], fval["val"]];
                  }
                }
              });
            } else {
              keyName = "feat_" + inval["att"];
              if (output[keyName] == null) {
                output[keyName] = inval["val"];
              } else {
                if ($.isArray(output[keyName])) {
                  output[keyName].push(inval["val"]);
                } else {
                  output[keyName] = [output[keyName], inval["val"]];
                }
              }
            }
          } else {
            output[inkey] = util.convertLMFFeatsToObjects(inval);
          }
        });
      } else if (theType === "array") {
        dArr = new Array();
        $.each(structure, function(inkey, inval) {
          dArr.push(util.convertLMFFeatsToObjects(inval));
        });
        output = dArr;
      } else {
        output = structure;
      }
      return output;
    } else {
      return null;
    }
  };

  util.findoutType = function(variable) {
    if ($.isArray(variable)) {
      return "array";
    } else {
      return typeof variable;
    }
  };

  util.formatCorpusExtraInfo = function(corpusObj) {
    var getUrnOrUrl, i, info_item, info_items, info_obj, label, link_info, makeLinkItem, makeUrnUrl, result;
    info_items = arguments.length > 1 && arguments[1] ? arguments[1] : (settings.corpusExtraInfoItems != null) || [];
    makeUrnUrl = function(urn) {
      if (urn.indexOf('http') !== 0) {
        return settings.urnResolver + urn;
      } else {
        return urn;
      }
    };
    getUrnOrUrl = function(obj) {
      var prefix;
      prefix = arguments.length > 1 ? arguments[1] : '';
      if (prefix + 'urn' in obj) {
        return makeUrnUrl(obj[prefix + 'urn']);
      } else {
        return obj[prefix + 'url'];
      }
    };
    makeLinkItem = function(link_info) {
      var href, result;
      result = '';
      if (link_info.label) {
        result += link_info.label + ': ';
      }
      if (link_info.url) {
        href = link_info.url.indexOf('{{') !== -1 ? 'ng-href' : 'href';
        result += '<a ' + href + '=\'' + link_info.url + '\' target=\'_blank\'' + (link_info.tooltip ? ' title=\'' + link_info.tooltip + '\'' : '') + '>' + link_info.text + '</a>';
      } else if (link_info.text) {
        if (link_info.tooltip) {
          result += '<span class=\'has_hover_text\' title=\'' + link_info.tooltip + '\'>' + link_info.text + '</span>';
        } else {
          result += link_info.text;
        }
      }
      return result;
    };
    result = '';
    i = 0;
    while (i < info_items.length) {
      info_item = info_items[i];
      link_info = {};
      label = '';
      label = '<span rel=\'localize[corpus_' + info_item + ']\'>' + 'Corpus ' + info_item + '</span>';
      if (info_item === 'urn' && corpusObj.urn) {
        link_info = {
          url: makeUrnUrl(corpusObj.urn),
          text: corpusObj.urn,
          label: label
        };
      } else if (info_item === 'homepage' && !('homepage' in corpusObj) && corpusObj.url) {
        link_info = {
          url: corpusObj.url,
          text: label
        };
      } else if (info_item === 'cite' && corpusObj.cite_id && (settings.corpus_cite_base_url != null)) {
        link_info = {
          url: settings.corpus_cite_base_url + escape(corpusObj.cite_id) + '&lang=' + window.lang,
          text: label
        };
      } else if (corpusObj[info_item]) {
        info_obj = corpusObj[info_item];
        link_info = {
          url: getUrnOrUrl(info_obj)
        };
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
      } else if (corpusObj[info_item + '_urn'] || corpusObj[info_item + '_url']) {
        link_info = {
          url: getUrnOrUrl(corpusObj, info_item + '_'),
          text: label
        };
      }
      if (link_info.url || link_info.text) {
        if (result) {
          result += '<br/>';
        }
        result += makeLinkItem(link_info);
      }
      i++;
    }
    return result;
  };

  util.copyCorpusInfoToConfig = function(corpusObj) {
    var added_properties, corpusInfo, i, info_key_prefix, info_key_sects, info_subkeys, item, j, key, sect, sect_name, subkey, subobj, value;
    info_key_sects = (function() {
      var k, len, ref, results;
      ref = settings.corpusExtraInfoItems;
      results = [];
      for (k = 0, len = ref.length; k < len; k++) {
        item = ref[k];
        if (item !== 'urn') {
          results.push(item.charAt(0).toUpperCase() + item.slice(1));
        }
      }
      return results;
    })();
    info_key_sects.push('');
    info_subkeys = ['Name', 'Description', 'URN', 'URL'];
    corpusInfo = corpusObj.info;
    i = 0;
    while (i < info_key_sects.length) {
      sect = info_key_sects[i];
      sect_name = sect.toLowerCase();
      subobj = corpusObj;
      if (sect !== '') {
        subobj = sect_name in corpusObj ? corpusObj[sect_name] : {};
      }
      info_key_prefix = sect + (sect === '' ? '' : '_');
      added_properties = false;
      j = 0;
      while (j < info_subkeys.length) {
        key = info_subkeys[j];
        subkey = key.toLowerCase();
        value = corpusInfo[info_key_prefix + key];
        if (value) {
          subobj[subkey] = value;
          added_properties = true;
        }
        j++;
      }
      if (sect !== '' && added_properties) {
        corpusObj[sect_name] = subobj;
      }
      i++;
    }
  };

  util.propagateCorpusFolderInfo = function(corpusFolder, info) {
    var addCorpusInfo, i, prop_name;
    addCorpusInfo = function(corpusConfig, info) {
      var prop_name;
      for (prop_name in info) {
        if (!(prop_name in corpusConfig)) {
          corpusConfig[prop_name] = info[prop_name];
        }
      }
    };
    if (corpusFolder.info) {
      info = $.extend(true, {}, info || {}, corpusFolder.info);
    }
    if (info) {
      corpusFolder.info = info;
    }
    if (info && corpusFolder.contents) {
      i = 0;
      while (i < corpusFolder.contents.length) {
        addCorpusInfo(settings.corpora[corpusFolder.contents[i]], info);
        i++;
      }
    }
    for (prop_name in corpusFolder) {
      if (prop_name !== 'title' && prop_name !== 'description' && prop_name !== 'contents' && prop_name !== 'info') {
        c.log('propagate ', prop_name);
        util.propagateCorpusFolderInfo(corpusFolder[prop_name], info);
      }
    }
  };

  util.forAllCorpora = function(func) {
    var corpus;
    for (corpus in settings.corpora) {
      func(settings.corpora[corpus]);
    }
  };

  util.initCorpusSettingsLinkAttrs = function() {
    var corpus;
    for (corpus in settings.corpora) {
      util.extractLinkAttrs(settings.corpora[corpus]);
    }
    return null;
  };

  util.extractLinkAttrs = function(corpusInfo) {
    var extractLinkAttrs, link_attrs;
    extractLinkAttrs = function(attrs, link_attrs) {
      var attr, attrname, results;
      if (attrs != null) {
        results = [];
        for (attrname in attrs) {
          attr = attrs[attrname];
          if (attr.type === "url" && (attr.url_opts != null) && attr.url_opts.in_link_section) {
            if (attr._link_attr) {
              results.push(link_attrs[attrname] = attr._link_attr);
            } else {
              link_attrs[attrname] = $.extend(true, {}, attr);
              attrs[attrname].displayType = "hidden";
              results.push(attrs[attrname]._link_attr = link_attrs[attrname]);
            }
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    };
    link_attrs = {};
    extractLinkAttrs(corpusInfo.attributes, link_attrs);
    extractLinkAttrs(corpusInfo.struct_attributes, link_attrs);
    corpusInfo.link_attributes = link_attrs;
    return null;
  };

  util.initCorpusSettingsSyntheticAttrs = function() {
    var corpus;
    for (corpus in settings.corpora) {
      util.setSyntheticAttrsInfo(settings.corpora[corpus]);
    }
  };

  util.setSyntheticAttrsInfo = function(corpusInfo) {
    var attrtype, setSyntheticAttrs;
    setSyntheticAttrs = function(attrs, synthetic_list) {
      var attr, attrname;
      if (attrs !== void 0) {
        for (attrname in attrs) {
          attr = attrs[attrname];
          if (attr.synthetic && attr.displayType !== 'hidden') {
            synthetic_list.push(attrname);
          }
        }
      }
    };
    corpusInfo.synthetic_attr_names = {
      attributes: [],
      struct_attributes: [],
      link_attributes: []
    };
    for (attrtype in corpusInfo.synthetic_attr_names) {
      setSyntheticAttrs(corpusInfo[attrtype], corpusInfo.synthetic_attr_names[attrtype]);
    }
  };

  util.listMatchingCorpora = function(regex) {
    var corp_re, corpus, inverse, match, opts, result;
    corp_re = RegExp("^(" + regex + ")$");
    opts = arguments.length > 1 ? arguments[1] : {};
    inverse = opts.inverse;
    result = [];
    for (corpus in settings.corpora) {
      match = corp_re.test(corpus);
      if ((match && !inverse) || (inverse && !match)) {
        result.push(corpus);
      }
    }
    if (opts.sort) {
      result.sort();
    }
    return result;
  };

  util.mapHashCorpusAliases = function() {
    var corpus, expandAlias, getUrlParam, mapCorpusAliasList, orig_corpus;
    getUrlParam = function(name) {
      var matches, param_re;
      param_re = RegExp("\\b" + name + "=([^&;]*)");
      matches = window.location.hash.match(param_re);
      if ((matches != null) && matches.length > 1) {
        return matches[1];
      } else {
        return null;
      }
    };
    expandAlias = function(alias) {
      var corp_spec, corp_specs, corpora, k, len;
      if (/[^a-z0-9_,-]/.test(alias)) {
        corpora = [];
        corp_specs = alias.split(",");
        for (k = 0, len = corp_specs.length; k < len; k++) {
          corp_spec = corp_specs[k];
          if (/[^a-z0-9_,-]/.test(corp_spec)) {
            corpora = corpora.concat(util.listMatchingCorpora(corp_spec));
          }
        }
        return corpora.join(",");
      } else {
        return alias;
      }
    };
    mapCorpusAliasList = function(corpus) {
      return _.map(corpus.split(","), function(corpus_id) {
        if (corpus_id in settings.corpus_aliases) {
          return expandAlias(settings.corpus_aliases[corpus_id]);
        } else {
          return corpus_id;
        }
      }).join(",");
    };
    if (settings.corpus_aliases != null) {
      orig_corpus = getUrlParam("corpus");
      if (orig_corpus) {
        corpus = mapCorpusAliasList(orig_corpus);
        if (corpus !== orig_corpus) {
          c.log("mapHashCorpusAliases", orig_corpus, "->", corpus);
          window.location.hash = window.location.hash.replace("corpus=" + orig_corpus, "corpus=" + corpus);
        }
      }
    }
  };

  util.initCorpusSettingsAttrDisplayOrder = function() {
    var corpus;
    for (corpus in settings.corpora) {
      util.setAttrDisplayOrder(settings.corpora[corpus]);
    }
  };

  util.setAttrDisplayOrder = function(corpusInfo) {
    var attr_name, attr_names, attr_type, index, k, l, len, len1, len2, len3, m, n, order, pattern, ref, ref1, ref2, result;
    ref = ["attributes", "struct_attributes", "link_attributes"];
    for (k = 0, len = ref.length; k < len; k++) {
      attr_type = ref[k];
      order = ((ref1 = corpusInfo.sidebar_display_order) != null ? ref1[attr_type] : void 0) || ((ref2 = settings.default_sidebar_display_order) != null ? ref2[attr_type] : void 0);
      if (order) {
        attr_names = _.keys(corpusInfo[attr_type]);
        result = [];
        for (l = 0, len1 = order.length; l < len1; l++) {
          pattern = order[l];
          if ($.type(pattern === "regexp")) {
            index = 0;
            for (m = 0, len2 = attr_names.length; m < len2; m++) {
              attr_name = attr_names[m];
              if (attr_name.match(pattern)) {
                result.push(attr_name);
                attr_names[index] = "";
              }
              index += 1;
            }
          } else if ($.type(pattern === "string")) {
            index = $.inArray(pattern, attr_names);
            if (index !== -1) {
              result.push(attr_names[index]);
              attr_names[index] = "";
            }
          }
        }
        for (n = 0, len3 = attr_names.length; n < len3; n++) {
          attr_name = attr_names[n];
          if (attr_name !== "") {
            result.push(attr_name);
          }
        }
        if (!corpusInfo._sidebar_display_order) {
          corpusInfo._sidebar_display_order = {};
        }
        corpusInfo._sidebar_display_order[attr_type] = result.reverse();
      }
    }
  };

  util.initCorpusSettingsFeatures = function() {
    return util.forAllCorpora(util.setCorpusFeatures);
  };

  util.setCorpusFeatures = function(corpusInfo) {
    var featname, features, k, len, ref, ref1;
    ref = corpusInfo.features || [];
    for (k = 0, len = ref.length; k < len; k++) {
      featname = ref[k];
      features = (ref1 = settings.corpus_features) != null ? ref1[featname] : void 0;
      if (!features) {
        c.warn("Warning: settings.corpus_features[\"" + featname + "\"] not defined: referred to in settings.corpora." + corpusInfo.id);
      } else {
        $.extend(true, corpusInfo, features);
      }
    }
  };

  util.initCorpusSettingsLogicalCorpora = function() {
    var corpus, corpus_id, ref;
    util.setFolderLogicalCorpora(settings.corporafolders);
    ref = settings.corpora;
    for (corpus_id in ref) {
      corpus = ref[corpus_id];
      if (!("logical_corpus" in corpus)) {
        corpus.logical_corpus = corpus;
      }
    }
  };

  util.setFolderLogicalCorpora = function(folder, logical_corpus) {
    var corpus, corpus_id, k, len, ref, ref1, ref2, subfolder, subfolder_logical_corpus, subfolder_name;
    if (logical_corpus == null) {
      logical_corpus = null;
    }
    c.log("setFolderLogicalCorpora", folder, logical_corpus != null ? logical_corpus.title : void 0);
    ref = folder.contents || [];
    for (k = 0, len = ref.length; k < len; k++) {
      corpus_id = ref[k];
      corpus = settings.corpora[corpus_id];
      corpus.logical_corpus = logical_corpus || settings.corpora[corpus_id];
    }
    for (subfolder_name in folder) {
      if (!hasProp.call(folder, subfolder_name)) continue;
      subfolder = folder[subfolder_name];
      if (subfolder_name !== "title" && subfolder_name !== "contents" && subfolder_name !== "description" && subfolder_name !== "info") {
        subfolder_logical_corpus = logical_corpus || (((ref1 = subfolder.info) != null ? ref1.is_logical_corpus : void 0) || ((ref2 = subfolder.info) != null ? ref2.urn : void 0) ? subfolder : void 0);
        util.setFolderLogicalCorpora(subfolder, subfolder_logical_corpus);
      }
    }
  };

  util.initCorpusSettingsLicenceCategory = function() {
    var corpus, corpus_id, ref, ref1, ref2, ref3, ref4, ref5, results;
    util.setFolderLicenceCategory(settings.corporafolders);
    ref = settings.corpora;
    results = [];
    for (corpus_id in ref) {
      corpus = ref[corpus_id];
      if (corpus.licence_type == null) {
        corpus.licence_type = ((ref1 = corpus.licence) != null ? ref1.category : void 0) || ((ref2 = corpus.logical_corpus) != null ? (ref3 = ref2.info) != null ? (ref4 = ref3.licence) != null ? ref4.category : void 0 : void 0 : void 0);
      }
      if ((ref5 = corpus.licence_type) === "ACA" || ref5 === "ACA-Fi" || ref5 === "RES") {
        results.push(corpus.limited_access = true);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  util.setFolderLicenceCategory = function(folder) {
    var category, licence_name, ref, ref1, ref2, results, subfolder, subfolder_name;
    licence_name = (ref = folder.info) != null ? (ref1 = ref.licence) != null ? ref1.name : void 0 : void 0;
    if (licence_name != null) {
      category = (ref2 = /(?:CLARIN )?(ACA(-Fi)?|RES)/.exec(licence_name)) != null ? ref2[1] : void 0;
      if (category != null) {
        folder.info.licence.category = category;
      }
    }
    results = [];
    for (subfolder_name in folder) {
      if (!hasProp.call(folder, subfolder_name)) continue;
      subfolder = folder[subfolder_name];
      if (subfolder_name !== "title" && subfolder_name !== "contents" && subfolder_name !== "description" && subfolder_name !== "info") {
        results.push(util.setFolderLicenceCategory(subfolder));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  settings.common_struct_types = {
    date_interval: {
      label: "date_interval",
      displayType: "date_interval",
      opts: false,
      extended_template: '<div class="date_interval_arg_type"> <div class="section"> <button class="btn btn-default btn-sm" popper no-close-on-click my="left top" at="right top"> <i class="fa fa-calendar"></i> {{"date_from" | loc:lang}} </button> {{combined.format("YYYY-MM-DD HH:mm")}} <time-interval ng-click="from_click($event)" class="date_interval popper_menu dropdown-menu" date-model="from_date" time-model="from_time" model="combined" min-date="minDate" max-date="maxDate"> </time-interval> </div> <div class="section"> <button class="btn btn-default btn-sm" popper no-close-on-click my="left top" at="right top"> <i class="fa fa-calendar"></i> {{"date_to" | loc:lang}} </button> {{combined2.format("YYYY-MM-DD HH:mm")}} <time-interval ng-click="from_click($event)" class="date_interval popper_menu dropdown-menu" date-model="to_date" time-model="to_time" model="combined2" my="left top" at="right top" min-date="minDate" max-date="maxDate"> </time-interval> </div> </div>',
      controller: [
        "$scope", "searches", "$timeout", function($scope, searches, $timeout) {
          var cl, getTime, getYear, ref, ref1, ref2, s, updateIntervals;
          s = $scope;
          cl = settings.corpusListing;
          updateIntervals = function() {
            var from, moments, ref, ref1, to;
            moments = cl.getMomentInterval();
            if (moments.length) {
              return ref = _.invoke(moments, "toDate"), s.minDate = ref[0], s.maxDate = ref[1], ref;
            } else {
              ref1 = cl.getTimeInterval(), from = ref1[0], to = ref1[1];
              s.minDate = moment(from.toString(), "YYYY").toDate();
              return s.maxDate = moment(to.toString(), "YYYY").toDate();
            }
          };
          s.$on("corpuschooserchange", function() {
            return updateIntervals();
          });
          updateIntervals();
          s.from_click = function(event) {
            event.originalEvent.preventDefault();
            return event.originalEvent.stopPropagation();
          };
          c.log("model", s.model);
          getYear = function(val) {
            return moment(val.toString(), "YYYYMMDD").toDate();
          };
          getTime = function(val) {
            c.log("getTime", val, moment(val.toString(), "HHmmss").toDate());
            return moment(val.toString(), "HHmmss").toDate();
          };
          if (!s.model) {
            s.from_date = s.minDate;
            s.to_date = s.maxDate;
            ref = _.invoke(cl.getMomentInterval(), "toDate"), s.from_time = ref[0], s.to_time = ref[1];
          } else if (s.model.length === 4) {
            ref1 = _.map(s.model.slice(0, 3), getYear), s.from_date = ref1[0], s.to_date = ref1[1];
            ref2 = _.map(s.model.slice(2), getTime), s.from_time = ref2[0], s.to_time = ref2[1];
          }
          return s.$watchGroup(["combined", "combined2"], function(arg) {
            var combined, combined2;
            combined = arg[0], combined2 = arg[1];
            c.log("combined", combined);
            c.log("combined2", combined2);
            s.model = [moment(s.from_date).format("YYYYMMDD"), moment(s.to_date).format("YYYYMMDD"), moment(s.from_time).format("HHmmss"), moment(s.to_time).format("HHmmss")];
            return c.log("s.model", s.model);
          });
        }
      ]
    }
  };

  util.addCQPs = function(params, cqp, cqp_mapper) {
    var cqps, i, k, key, ref, val;
    if (cqp_mapper == null) {
      cqp_mapper = function(cqp) {
        return cqp;
      };
    }
    if (typeof cqp === "string" || cqp instanceof String) {
      if (cqp.indexOf("||") !== -1) {
        cqps = cqp.split("||");
        params["cqp"] = cqp_mapper(cqps[0]);
        for (i = k = 1, ref = cqps.length; 1 <= ref ? k < ref : k > ref; i = 1 <= ref ? ++k : --k) {
          params["cqp" + i.toString()] = cqp_mapper(cqps[i]);
        }
      } else {
        params.cqp = cqp_mapper(cqp);
      }
    } else {
      for (key in cqp) {
        val = cqp[key];
        if (key.substr(0, 3) === "cqp") {
          params[key] = cqp_mapper(val);
        }
      }
    }
  };

  util.combineCQPs = function(params) {
    var cqp_keys, key;
    if ($.isArray(params)) {
      return params.join("||");
    } else {
      cqp_keys = (function() {
        var results;
        results = [];
        for (key in Object.keys(params)) {
          if (key.substr(0, 3) === "cqp") {
            results.push(key);
          }
        }
        return results;
      })();
      cqp_keys = _.sortBy(cqp_keys, function(key) {
        return parseInt(key.substr(4) || "0");
      });
      return ((function() {
        var k, len, results;
        results = [];
        for (k = 0, len = cqp_keys.length; k < len; k++) {
          key = cqp_keys[k];
          results.push(params[key]);
        }
        return results;
      })()).join("||");
    }
  };

  util.addPrequeryWithin = function(params) {
    if (params.cqp1 && search().prequery_within) {
      return params.defaultwithin = search().prequery_within;
    }
  };

  util.applyShortUrlConfig = function() {
    var last_path_comp;
    window.short_url = null;
    if (settings.short_url_config) {
      last_path_comp = _.last(_.compact(window.location.pathname.split("/")));
      if (last_path_comp && settings.short_url_config[last_path_comp]) {
        settings.short_url_config[last_path_comp](last_path_comp);
        return window.short_url = last_path_comp;
      }
    }
  };

  util.setMode = function(mode, override_explicit) {
    var params;
    if (override_explicit == null) {
      override_explicit = false;
    }
    if (mode !== window.currentMode) {
      params = $.deparam.querystring();
      if (override_explicit || !params.mode) {
        params.mode = mode;
        return window.location.search = "?" + $.param(params);
      }
    }
  };

  util.splitCompareKey = function(key, reduce_attrs, attr_is_struct_attr) {
    var reduce_len, ref, split_attrs;
    c.log("splitCompareKey", key, reduce_attrs, attr_is_struct_attr);
    reduce_len = reduce_attrs.length;
    if (reduce_len > 1) {
      split_attrs = key.split("/");
      if (split_attrs.length > reduce_len) {
        [].splice.apply(split_attrs, [reduce_len, 9e9].concat(ref = split_attrs.slice(reduce_len).join("/"))), ref;
      }
    } else {
      split_attrs = [key];
    }
    c.log("split_attrs", split_attrs, reduce_attrs, reduce_len);
    return _.map(split_attrs, function(tokens, attr_idx) {
      if (attr_is_struct_attr[attr_idx]) {
        return [tokens];
      } else {
        return tokens.split(" ");
      }
    });
  };

  util.makeShibbolethLink = function(selector, url_prop, add_link_fn, url_filter) {
    var url;
    if (url_filter == null) {
      url_filter = _.identity;
    }
    url = settings[url_prop];
    if (url != null) {
      if (typeof url !== "function") {
        add_link_fn($(selector), url);
      } else {
        add_link_fn($(selector), "javascript:");
        $(selector).find("a").click((function(url_fn) {
          return function(e) {
            e.preventDefault();
            window.location.href = url_fn(url_filter(window.location.href));
          };
        })(url));
      }
    } else {
      c.warn("settings." + url_prop + " not defined");
    }
  };

  util.url_add_corpora = function(href, corpora) {
    var corpora_str;
    corpora_str = corpora.join(",");
    if (href.indexOf("corpus=") === -1) {
      return href + "&corpus=" + corpora_str;
    } else {
      return href.replace(/(&corpus=[^&]+)/, "$1," + corpora_str);
    }
  };

  util.url_remove_corpora = function(href, corpora) {
    var href_corpora;
    if (href.indexOf("corpus=") === -1) {
      return href;
    } else {
      href_corpora = /corpus=([^&]*)/.exec(href)[1].split(",");
      href_corpora = _.difference(href_corpora, corpora).join(",");
      href = href.replace(/(&corpus=)[^&]+/, "$1" + href_corpora);
      return href;
    }
  };

  util.showRestrictedCorporaModal = function(corpora) {
    var access_res_modal, corpus_lbr_urls, corpus_licence_cats, corpus_titles, licence_cats, logical_corpora, make_lbr_url, modal_class;
    make_lbr_url = function(logical_corpus) {
      var corpinfo, ref;
      corpinfo = logical_corpus.logical_corpus != null ? logical_corpus : logical_corpus.info;
      return settings.make_direct_LBR_URL((corpinfo != null ? corpinfo.lbr_id : void 0) || (corpinfo != null ? corpinfo.metadata_urn : void 0) || (corpinfo != null ? (ref = corpinfo.metadata) != null ? ref.urn : void 0 : void 0));
    };
    c.log("showRestrictedCorporaModal", corpora);
    util.makeShibbolethLink("#resCorporaLogin", "shibbolethLoginUrl", (function(_this) {
      return function(elem, href) {
        return elem.find("a").attr("href", href);
      };
    })(this), (function(_this) {
      return function(href) {
        return util.url_add_corpora(href, corpora);
      };
    })(this));
    logical_corpora = _(corpora).map(function(corp) {
      var ref;
      return (ref = settings.corpora[corp]) != null ? ref.logical_corpus : void 0;
    }).unique().compact().value();
    if (logical_corpora.length) {
      corpus_titles = _.pluck(logical_corpora, "title");
      corpus_licence_cats = _.map(logical_corpora, function(corpinfo) {
        var ref, ref1, ref2;
        return ((ref = corpinfo.info) != null ? (ref1 = ref.licence) != null ? ref1.category : void 0 : void 0) || ((ref2 = corpinfo.licence) != null ? ref2.category : void 0) || corpinfo.licence_type || "RES";
      });
      corpus_lbr_urls = _.map(logical_corpora, make_lbr_url);
      c.log("You are not allowed to access the following corpora:", corpora, corpus_titles);
      $("#resCorporaList").html(_(_.zip(corpus_titles, corpus_licence_cats, corpus_lbr_urls)).sortBy(function(elem) {
        return elem[0];
      }).map(function(arg) {
        var lic, title, url;
        title = arg[0], lic = arg[1], url = arg[2];
        return "<li><a href=\"" + url + "\" target=\"_blank\">" + title + " [" + lic + "]</a></li>";
      }).value());
      licence_cats = _(corpus_licence_cats).unique().compact().map(function(s) {
        return s.replace('-', '');
      }).sortBy().value().join("").toLowerCase();
      c.log("licence_cats", licence_cats);
      access_res_modal = $("#accessResCorporaModal");
      modal_class = "access-corpora-" + licence_cats;
      access_res_modal.addClass(modal_class);
      access_res_modal.on("hidden.bs.modal", function() {
        return access_res_modal.removeClass(modal_class);
      });
      access_res_modal.on("click", function(evt) {
        return evt.stopPropagation();
      });
      access_res_modal.modal();
    }
  };

  util.checkTryingRestrictedCorpora = function(selected_corpora) {
    var allowed, allowed_restricted, creds, non_allowed_corpora, restricted_corpora, selected_all, selected_nonrestricted, selected_restricted_corpora;
    if (!(selected_corpora != null ? selected_corpora.length : void 0)) {
      return;
    }
    restricted_corpora = settings.corpusListing.getRestrictedCorpora();
    selected_restricted_corpora = _.intersection(restricted_corpora, selected_corpora);
    if (selected_restricted_corpora != null ? selected_restricted_corpora.length : void 0) {
      creds = $.jStorage.get("creds");
      allowed = _.map((creds != null ? creds.credentials : void 0) || [], function(corp) {
        return corp.toLowerCase();
      });
      non_allowed_corpora = _.difference(selected_restricted_corpora, allowed);
      if (non_allowed_corpora != null ? non_allowed_corpora.length : void 0) {
        util.showRestrictedCorporaModal(non_allowed_corpora);
      }
      allowed_restricted = _.intersection(selected_restricted_corpora, allowed);
      if (allowed_restricted != null ? allowed_restricted.length : void 0) {
        selected_nonrestricted = _.difference(selected_corpora, selected_restricted_corpora);
        selected_all = _.union(selected_nonrestricted, allowed_restricted);
        settings.corpusListing.select(selected_all);
        if (typeof corpusChooserInstance !== "undefined" && corpusChooserInstance !== null) {
          corpusChooserInstance.corpusChooser("selectItems", selected_all);
        }
      }
    }
  };

}).call(this);
