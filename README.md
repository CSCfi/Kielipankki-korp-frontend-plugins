
# Korp frontend plugins

This is an independent branch of the
[Kielipankki-korp-frontend](https://github.com/CSCfi/Kielipankki-korp-frontend)
repository, containing plugins for the Korp frontend. The plugins have
been developed and are being used in [Kielipankki – The Language Bank
of Finland](https://www.kielipankki.fi/language-bank/).

The files for plugin *plugin_name* should be in the directory
`app/plugins/`*plugin_name*`/`, preferably containing a `README.md`
file and organized into subdirectories similarly to the Korp frontend
itself:

- `scripts/`: JavaScript source code for the plugin, typically with
  `main.js` as the main source file.
- `translations/`: Translations for localizable labels used in the
  plugin as files `locale-`*lg*`.json` where *lg* is a language code.
  You should provide at least `locale-en` for English.
