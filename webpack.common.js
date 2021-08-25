/** @format */
const webpack = require("webpack")
const path = require("path")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

function getKorpConfigDir() {
    fs = require("fs")
    let config = "app"
    try {
        json = fs.readFileSync("run_config.json", { encoding: "utf-8" })
        config = JSON.parse(json).configDir || "app"
        console.log('Using "' + config + '" as config directory.')
    } catch (err) {
        console.error(err)
        console.log('No run_config.json given, using "app" as config directory (default).')
    }
    return config
}

const {accessSync, constants: {R_OK}} = require('fs');

const exists = filename => {
    try {
        accessSync(filename, R_OK);
        return true;
    } catch (err) {
        return false;
    }
};

// A Pug plugin to search for files to be included from multiple
// directories specified as the paths argument.
//
// To enable non-default behaviour, the filename of the include
// directive needs to be prefixed with options between two colons,
// separated by commas; for example:
//     include :search,optional:includes/file
// The following options are recognized:
// - search: Search paths for file and include the first one, unless
//   option "all" is also specified
// - all: Include all the files found in the order of paths (only in
//   conjunction with "search")
// - optional: No error if no file is found
//
// Inspired by
// https://github.com/pugjs/pug/issues/2499#issuecomment-241927949
//
// TODO:
// - When including the contents of all found files, sort them
//   somehow. A way to do this could be to suffix file names with a
//   double-digit number: "include :search,all:file" would include
//   "file-10.pug" and "file-20.pug", in this order. Another option
//   could be to list names (or patterns) for paths in the order in
//   which they should be considered as an argument to option "all";
//   for example, "include :search,all=plugin1+plugin2"; non-matching
//   ones would be included in an arbitrary order after the matching
//   ones (or maybe optionally not included).
// - Support globs in paths.
// - Optionally search paths recursively.
function PugMultiplePathsPlugin ({paths = []}) {
    let load = require("pug-load")
    return {
        name: 'multiplePaths',
        // Resolve filename to a fully-resolved path or multiple paths
        // separated by vertical bars (resolve has to return a string)
        resolve (filename, source, options) {
            let out = ""
            let fileopts = {}
            // console.log("resolve", filename, source, options, paths)
            // Extract possible file options
            const extractFileOptions = function (filename) {
                let fileopts = {}
                if (filename.startsWith(":")) {
                    filename = filename.slice(1)
                    const colonpos = filename.indexOf(":")
                    fileoptStr = filename.slice(0, colonpos)
                    fileoptStr.split(",").forEach(opt => fileopts[opt] = true)
                    filename = filename.slice(colonpos + 1)
                }
                return [filename, fileopts]
            };
            // Get the subdirectory of filename relative to basedir
            const getRelativeSubdir = function (basedir, filename) {
                // console.log("getRelativeSubdir", basedir, filename)
                if (! filename.startsWith(basedir)) {
                    return ""
                }
                let filenameRel = filename.slice(basedir.length + 1)
                let lastSlashPos = filenameRel.lastIndexOf("/")
                if (lastSlashPos == -1) {
                    // filename is directly in basedir
                    return ""
                }
                // Include trailing slash
                return filenameRel.slice(0, lastSlashPos + 1)
            };
            [filename, fileopts] = extractFileOptions(filename)
            // console.log("fileopts =", fileopts)
            if (paths.length > 0 && fileopts.search) {
                // If file options contains "search", search for
                // filename in each of paths
                // Include the subdirectory relative to basedir
                filename = getRelativeSubdir(options.basedir, source) + filename
                for (let pth of paths) {
                    let fname = path.resolve(pth, filename)
                    // console.log("exists", pth, filename, fname, exists(fname))
                    if (exists(fname)) {
                        // Return the first one found, unless the file
                        // option "all" has been specified
                        if (! fileopts.all) {
                            return fname
                        }
                        out += "|" + fname
                    }
                }
                // Strip leading vertical bar
                out = out.slice(1)
                // If not found and option "optional" not specified,
                // throw an error
                if (! out && ! fileopts.optional) {
                    let pathstr = paths.join(", ")
                    throw new Error(
                        `${filename} cannot be found in any of the specified`
                        + `directories: ${pathstr}`)
                }
            } else {
                // The default include behaviour
                out = load.resolve(filename, source, options)
                if (! exists(out) && fileopts.optional) {
                    out = ""
                }
            }
            // console.log("out =", out)
            return out
        },
        read (filename, options) {
            // Return the content of filename. filename may contain
            // multiple file names separated by vertical bars, in
            // which case the contents of the files are concatenated.
            // console.log("read", filename)
            // Skip empty file names, as that means that an optional
            // include file was not found.
            if (! filename) {
                return ""
            }
            let out = ""
            let filenames = filename.split("|")
            for (let fname of filenames) {
                out += load.read(fname, options)
                // console.log("read", fname)
            }
            // console.log("read:out", out)
            return out
        },
    };
}


module.exports = {
    resolve: {
        alias: {
            jquery: path.resolve(__dirname, "node_modules/jquery/src/jquery"),
            jreject: path.resolve(__dirname, "app/lib/jquery.reject"),
            jquerylocalize: path.resolve(__dirname, "app/lib/jquery.localize"),
            jqueryhoverintent: path.resolve(__dirname, "app/lib/jquery.hoverIntent"),
            configjs: path.resolve(korpConfigDir, "config.js"),
            commonjs: path.resolve(korpConfigDir, "modes/common.js"),
            defaultmode: path.resolve(korpConfigDir, "modes/default_mode.js"),
            custom: path.resolve(korpConfigDir, "custom/"),
            '@': path.resolve(__dirname, "app/scripts"),
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: path.resolve(__dirname, "tsconfig.json"),
                    },
                },
                exclude: /node_modules/,
            },
            {
                test: require.resolve(
                    path.resolve(__dirname, "app/scripts/cqp_parser/CQPParser.js")
                ),
                use: "imports-loader?this=>window",
            },
            {
                test: /\.pug$/i,
                exclude: [
                    // does not work
                    path.resolve(__dirname, "app/index.pug"),
                ],
                use: [
                    { loader: "file-loader" },
                    {
                        loader: "extract-loader",
                        options: { publicPath: "" },
                    },
                    { loader: "html-loader" },
                    { loader: "pug-html-loader" },
                ],
            },
            {
                test: /index.pug$/,
                use: [
                    { loader: "file-loader?name=index.html" },
                    {
                        loader: "extract-loader",
                        options: { publicPath: "" },
                    },
                    {
                        loader: "html-loader",
                        options: {
                            attrs: ["img:src", "link:href"],
                        },
                    },
                    {
                        loader: "pug-html-loader",
                        options: {
                            // TODO we should not pretty-print HTML, but removing this
                            // option will result in that some elements get closer together
                            // and need to be fixed with CSS
                            pretty: true,
                            basedir: path.resolve(__dirname, "app"),
                            plugins: PugMultiplePathsPlugin({
                                // TODO: Add all Korp plugin directories
                                paths: [
                                    path.resolve(korpConfigDir),
                                    "app",
                                ]
                            }),
                        },
                    },
                ],
            },
            {
                test: /\.html$/,
                use: [
                    {
                        loader: "html-loader",
                        options: {
                            minimize: true,
                            conservativeCollapse: false,
                        },
                    },
                ],
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loader: "file-loader?name=[name].[contenthash].[ext]",
            },
            {
                test: /\.ico$/i,
                loader: "file-loader?name=[name].[ext]",
            },
            {
                test: /\.otf$/i,
                loader: "file-loader",
            },
            {
                test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                loader: "file-loader?mimetype=application/font-woff",
            },
            {
                test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                loader: "file-loader?mimetype=application/font-woff",
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: "file-loader?mimetype=application/octet-stream",
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: "file-loader",
            },
            {
                test: /\.css$/,
                use: [{ loader: "style-loader" }, { loader: "css-loader" }],
            },
            {
                test: /\.scss$/,
                use: [
                    "style-loader", // creates style nodes from JS strings
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: process.env.NODE_ENV !== "production",
                        },
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            // plugins: () => [require("tailwindcss"), require("autoprefixer")],
                            // sourceMap: process.env.NODE_ENV !== "production",
                        },
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: process.env.NODE_ENV !== "production",
                            // sourceMapContents: false
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: korpConfigDir + "/modes/*mode.js",
                    to: "modes/[name].[ext]",
                },
                {
                    from: korpConfigDir + "/modes/*html",
                    to: "modes/[name].[ext]",
                    noErrorOnMissing: true,
                },
                {
                    from: "app/translations/angular-locale_*.js",
                    to: "translations/[name].[ext]",
                },
                {
                    from: "app/markup/msdtags.html",
                    to: "markup",
                },
                {
                    from: "app/translations/locale-*.json",
                    to: "translations/[name].[ext]",
                },
                {
                    from: korpConfigDir + "/translations/*",
                    to: "translations/[name].[ext]",
                },
                {
                    from: "app/lib/deptrees/",
                    to: "lib/deptrees",
                },
            ],
        }),
    ],
    entry: {
        bundle: "./app/index.js",
        worker: "./app/scripts/statistics_worker.ts",
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
        globalObject: "this",
    },
}
