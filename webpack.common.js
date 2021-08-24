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

// Adapted from https://github.com/pugjs/pug/issues/2499#issuecomment-241927949
// The approach works in principle, but it needs some elaboration.
// TODO:
// - Take into account relative includes that should not be searched
//   for in app/ but relative to the including file. Or should we just
//   test multiple paths only for absolute includes as in the
//   original? Or maybe for includes containing directory component?
//   Or rather prefix or suffix the filename with an option such as
//   "search:" or ":search" or "|search"? (If suffix, remember to trim
//   the ".pug" extension.)
// - Ignore (optionally?) non-found includes.
// - Including the contents of all found files also seems possible in
//   the way it is done below: resolve joins the names to a single
//   string, separated by "|" (or some other separator), and read
//   splits the filename by the separator. resolve cannot return an
//   array, as Pug seems to validate arguments somewhere and raises a
//   type error on an array insted of string. However, for including
//   the content of all files to make sense, it would need to be
//   optional depending on the include, as otherwise it would be
//   impossible to override the content of a standard include, such as
//   the cog menu. The option could be prefixed or suffixed in the
//   same way as the option for searching the path.
// - When including the contents of all found files, sort them
//   somehow. A way to do this could be to suffix file names with a
//   double-digit number: "include file" would include "file-10.pug"
//   and "file-20.pug", in this order. Another option could be to list
//   names (or patterns) for paths in the order in which they should
//   be considered; non-matching ones would be included in an
//   arbitrary order after the matching ones.
function PugMultiplePathsPlugin ({paths = []}) {
    let load = require("pug-load")
    return {
        name: 'multiplePaths',
        resolve (filename, source, options) {
            let out = [];
            console.log("resolve", filename, source, options, paths)
            if (filename.startsWith("search:")) {
                filename = filename.slice(7)
                for (let pth of paths) {
                    let fname = path.resolve(pth, filename)
                    console.log("exists", pth, filename, fname, exists(fname))
                    if (exists(fname)) {
                        out.push(fname)
                    }
                }
                out = out.join("|")
            } else {
                out = load.resolve(filename, source, options)
                // if (!source) {
                //     throw new Error('the "filename" option is required to use includes and extends with "relative" paths');
                // }
                // out = path.resolve(path.dirname(source), filename);
            }
            // if (! paths.some(pth => exists(out = path.resolve(pth, filename)))) {
            //     throw new Error(
            //         `${filename} cannot be found in any specified directory`);
            // }
            return out;
        },
        read (filename, options) {
            console.log("read", filename, options)
            let out = ""
            let filenames = filename.split("|")
            for (let fname of filenames) {
                out += load.read(fname, options)
            }
            console.log("read:out", out)
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
