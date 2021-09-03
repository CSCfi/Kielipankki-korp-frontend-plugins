/** @format */

let customExtendedTemplates = {}

try {
    customExtendedTemplates = require("custom/extended.js").default
} catch (error) {
    console.log("No module for extended components available")
}

const autocompleteTemplate = `\
<div>
    <input type="text"
            size="37"
            ng-model="input"
            escaper
            typeahead-min-length="0"
            typeahead-input-formatter="typeaheadInputFormatter($model)"            
            uib-typeahead="tuple[0] as tuple[1] for tuple in getRows($viewValue)"></input>
</div>`

const selectTemplate =
    "<select ng-show='!inputOnly' ng-model='input' escaper ng-options='tuple[0] as tuple[1] for tuple in dataset'></select>" +
    "<input ng-show='inputOnly' type='text' ng-model='input'/>"
const localize = ($scope) =>
    function (str) {
        return util.translateAttribute(null, $scope.translation, str)
    }

const selectController = (autocomplete) => [
    "$scope",
    "$rootScope",
    "structService",
    function ($scope, $rootScope, structService) {
        $rootScope.$on("corpuschooserchange", function (event, selected) {
            if (selected.length > 0) {
                reloadValues()
            }
        })

        function reloadValues() {
            const attribute = $scope.$parent.tokenValue.value
            const selectedCorpora = settings.corpusListing.selected

            // check which corpora support attributes
            const corpora = []
            for (let corpusSettings of selectedCorpora) {
                if (attribute in corpusSettings.structAttributes || attribute in corpusSettings.attributes) {
                    corpora.push(corpusSettings.id)
                }
            }

            $scope.loading = true
            const opts = { count: false, returnByCorpora: false }
            if ($scope.type === "set") {
                opts.split = true
            }
            structService.getStructValues(corpora, [attribute], opts).then(
                function (data) {
                    $scope.loading = false
                    const localizer = localize($scope)

                    const dataset = _.map(_.uniq(data), function (item) {
                        if (item === "") {
                            return [item, util.getLocaleString("empty")]
                        }
                        return [item, localizer(item)]
                    })
                    $scope.dataset = _.sortBy(dataset, (tuple) => tuple[1])
                    if (!autocomplete) {
                        $scope.input = _.includes(data, $scope.input) ? $scope.input : $scope.dataset[0][0]
                    }
                },
                () => c.log("struct_values error")
            )
        }

        // Load values initially
        reloadValues()

        $scope.$watch("orObj.op", (newVal, oldVal) => {
            $scope.inputOnly = !["=", "!=", "contains", "not contains"].includes($scope.orObj.op)
            if (newVal !== oldVal) {
                if (!autocomplete) {
                    $scope.input = "" || $scope.dataset[0][0]
                }
            }
        })

        $scope.getRows = function (input) {
            if (input) {
                return _.filter($scope.dataset, (tuple) => tuple[0].toLowerCase().indexOf(input.toLowerCase()) !== -1)
            } else {
                return $scope.dataset
            }
        }

        $scope.typeaheadInputFormatter = (model) => localize($scope)(model)
    },
]

const datasetSelectController = (grouping) => [
    "$scope",
    "$rootScope",
    function ($scope, $rootScope) {
        let dataset
        const original = $scope.dataset

        $rootScope.$watch("lang", (newVal, oldVal) => {
            if (newVal != oldVal) {
                initialize()
            }
        })
        function initialize() {
            const localizer = localize($scope)
            let sorter
            if (! grouping) {
                if (_.isArray(original)) {
                    dataset = _.map(original, (item) => [item, localizer(item)])
                } else {
                    dataset = _.map(original, (v, k) => [k, localizer(v)])
                }
                sorter = (tuple) => tuple[1]
            } else {
                dataset = _.flatten(
                    _.map(original, (groupVals, group) =>
                        _.isArray(groupVals)
                            // {"g1": ["v11", "v12"], "g2": ["v21", "v22"]}
                            // -> [["v11", "v11", "g1"], ["v12", "v12", "g1"], ...]
                            ? _.map(groupVals, (item) =>
                                [item, localizer(item), localizer(group)])
                            // {"g1": {"k11": "v11", "k12": "v12"}, "g2": ...}
                            // -> [["v11", "k11", "g1"], ["v12", "k12", "g1"], ...]
                            : _.map(groupVals, (v, k) =>
                                [k, localizer(v), localizer(group)])
                    ))
                sorter = (tuple) => tuple[2] + "\x01" + tuple[1]
            }
            $scope.dataset = _.sortBy(dataset, sorter)
            $scope.model = $scope.model || $scope.dataset[0][0]
        }
        initialize()
    },
]

export default _.merge(
    {
        // Select-element. Use the following settings in the corpus:
        // - dataset: an object or an array of values
        // - escape: boolean, will be used by the escaper-directive
        datasetSelect: {
            template: selectTemplate,
            controller: datasetSelectController(false),
        },

        // Select-element with groups. Use the following settings in the corpus:
        // - dataset: an object with keys as group names and values as
        //   objects or arrays of values within the group
        // - escape: boolean, will be used by the escaper-directive
        groupedDatasetSelect: {
            // TODO: Modifying selectTemplate like below is a bit
            // ugly; maybe use a common template with a placeholder
            // for the grouping clause, or have a function to return
            // the object containing both the template and controller.
            template: selectTemplate.replace(/(for tuple)/, "group by tuple[2] $1"),
            controller: datasetSelectController(true),
        },

        // Select-element. Gets values from "struct_values"-command. Use the following settings in the corpus:
        // - escape: boolean, will be used by the escaper-directive
        structServiceSelect: {
            template: selectTemplate,
            controller: selectController(false),
        },

        // Autocomplete. Gets values from "struct_values"-command. Use the following settings in the corpus:
        // - escape: boolean, will be used by the escaper-directive
        structServiceAutocomplete: {
            template: autocompleteTemplate,
            controller: selectController(true),
        },

        // puts the first values from a dataset paramater into model
        singleValue: {
            template: '<input type="hidden">',
            controller: ["$scope", ($scope) => ($scope.model = _.values($scope.dataset)[0])],
        },
        default: {
            template: _.template(`\
            <input ng-model='input' class='arg_value' escaper 
                    ng-model-options='{debounce : {default : 300, blur : 0}, updateOn: "default blur"}'
            <%= maybe_placeholder %>>
            <span ng-class='{sensitive : case == "sensitive", insensitive : case == "insensitive"}'
                    class='val_mod' popper> Aa </span>
            <ul class='mod_menu popper_menu dropdown-menu'>
                    <li><a ng-click='makeSensitive()'>{{'case_sensitive' | loc:lang}}</a></li>
                    <li><a ng-click='makeInsensitive()'>{{'case_insensitive' | loc:lang}}</a></li>
            </ul>
        `),
            controller: [
                "$scope",
                function ($scope) {
                    if ($scope.orObj.flags && $scope.orObj.flags.c) {
                        $scope.case = "insensitive"
                    } else {
                        $scope.case = "sensitive"
                    }

                    $scope.makeSensitive = function () {
                        $scope.case = "sensitive"
                        if ($scope.orObj.flags) {
                            delete $scope.orObj.flags["c"]
                        }
                    }

                    $scope.makeInsensitive = function () {
                        const flags = $scope.orObj.flags || {}
                        flags["c"] = true
                        $scope.orObj.flags = flags

                        $scope.case = "insensitive"
                    }
                },
            ],
        },
        autocExtended: (options) => ({
            template: `
        <autoc 
            input="input"
            is-raw-input="isRawInput"
            type='${options.type || "lemgram"}'
            on-change="onChange(output, isRawOutput)"
            error-on-empty="${options.errorOnEmpty}"
            error-message="choose_value">
        </autoc>`,
            controller: [
                "$scope",
                function ($scope) {
                    if ($scope.model) {
                        $scope.input = unregescape($scope.model)
                        $scope.isRawInput = false
                    }

                    $scope.onChange = (output, isRawOutput) => {
                        if (!isRawOutput) {
                            $scope.model = regescape(output)
                        }
                    }
                },
            ],
        }),
    },
    customExtendedTemplates
)
