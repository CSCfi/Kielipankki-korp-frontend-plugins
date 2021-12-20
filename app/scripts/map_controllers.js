/** @format */
const korpApp = angular.module("korpApp")

korpApp.directive("mapCtrl", ($timeout, searches) => ({
    controller($scope, $rootScope) {
        const s = $scope

        s.onentry = () => s.$broadcast("update_map")

        s.loading = true
        s.newDynamicTab()
        s.markers = {}
        s.selectedGroups = []
        s.markerGroups = []
        s.mapSettings = { baseLayer: "OpenStreetMap" }
        s.numResults = 0
        s.useClustering = false

        if (!window.Rickshaw) {
            var rickshawPromise = import(/* webpackChunkName: "rickshaw" */ "rickshaw")
        }

        Promise.all([rickshawPromise || Rickshaw, s.promise]).then(
            ([rickshawModule, result]) => {
                window.Rickshaw = rickshawModule
                s.$apply(($scope) => {
                    $scope.loading = false
                    $scope.numResults = 20
                    $scope.markerGroups = getMarkerGroups(result)
                    $scope.selectedGroups = _.keys($scope.markerGroups)
                    $scope.center = getCenter(result)
                })
            },
            (err) => {
                console.error("Map data parsing failed:", err)
                this.s.$apply(($scope) => {
                    $scope.loading = false
                    $scope.error = true
                })
            }
        )

        s.toggleMarkerGroup = function (groupName) {
            s.markerGroups[groupName].selected = !s.markerGroups[groupName].selected
            if (s.selectedGroups.includes(groupName)) {
                return s.selectedGroups.splice(s.selectedGroups.indexOf(groupName), 1)
            } else {
                return s.selectedGroups.push(groupName)
            }
        }

        var getMarkerGroups = function (result) {
            const palette = new Rickshaw.Color.Palette({ scheme: "colorwheel" }) // spectrum2000
            const groups = {}
            _.map(
                result.data,
                (res, idx) =>
                    (groups[res.label] = {
                        selected: true,
                        order: idx,
                        color: palette.color(),
                        markers: getMarkers(
                            result.attribute.label,
                            result.cqp,
                            result.corpora,
                            result.within,
                            res,
                            idx
                        ),
                    })
            )
            s.restColor = "#9b9fa5"
            return groups
        }

        var getMarkers = function (label, cqp, corpora, within, res, idx) {
            const markers = {}

            for (let [pointIdx, point] of res.points.entries()) {
                // Include point index in the key, so that multiple
                // places with the same name but different coordinates
                // each get their own markers
                const id = [point.name.replace(/-/g, ""),
                            pointIdx.toString(),
                            idx].join(":")
                markers[id] = {
                    lat: point.lat,
                    lng: point.lng,
                    queryData: {
                        searchCqp: cqp,
                        subCqp: res.cqp,
                        label,
                        corpora,
                        within,
                    },
                    label: res.label,
                    point,
                }
            }

            return markers
        }

        // Get the map center coordinates and zoom level for a map result
        const getCenter = function (result) {
            // Get the point data only
            const points = _.flatten(_.map(result.data,
                                           (res) => _.map(res.points)))
            // for (let f in calcCenterFunc) {
            //     c.log(f, calcCenterFunc[f](points))
            // }
            return calcCenterFunc[settings.calculateMapCenter](points)
        }

        // Functions for calculating map center based on an array of
        // points. settings.calculateMapCenter should be set to the
        // name of the function to be used.
        const calcCenterFunc = {
            // Center to the coordinates specified in settings.mapCenter
            fixed: function (points) {
                return settings.mapCenter
            },
            // Center to the point with the maximum absolute frequency
            maximumAbsoluteFrequency: function (points) {
                const maxPoint = _.maxBy(points, 'abs')
                return makeCenter(maxPoint.lat, maxPoint.lng)
            },
            // Center to the average of the latitudes and longitudes
            // of all the points
            average: function (points) {
                const avgLat = _.meanBy(points, 'lat')
                const avgLng = _.meanBy(points, 'lng')
                return makeCenter(avgLat, avgLng)
            },
            // Center to the average of the latitudes and longitudes
            // of all the points, weighted by the absolute frequency
            // of each point
            weightedAverage: function (points) {
                const totalFreq = _.sumBy(points, 'abs')
                const avgLat = (_.sumBy(points,
                                        (point) => point.abs * point.lat)
                                / totalFreq)
                const avgLng = (_.sumBy(points,
                                        (point) => point.abs * point.lng)
                                / totalFreq)
                return makeCenter(avgLat, avgLng)
            },
            // Center to the middle of the northernmost and
            // southernmost and the westernmost and easternmost points
            centerPoint: function (points) {
                const centerLat = (
                    _.minBy(points, 'lat').lat + _.maxBy(points, 'lat').lat) / 2
                const centerLng = (
                    _.minBy(points, 'lng').lng + _.maxBy(points, 'lng').lng) / 2
                return makeCenter(centerLat, centerLng)
            },
        }

        // Make a center object by combining lat and lng with
        // settings.mapCenter.zoom
        const makeCenter = function (lat, lng) {
            return {
                lat: lat,
                lng: lng,
                zoom: settings.mapCenter.zoom,
            }
        }

        // If settings.calculateMapCenter is undefined or unrecognized, use
        // "fixed" (settings.mapCenter), for backward compatibility
        if (! settings.calculateMapCenter || ! calcCenterFunc[settings.calculateMapCenter]) {
            settings.calculateMapCenter = "fixed"
        }

        s.newKWICSearch = function (marker) {
            const { queryData } = marker
            const { point } = marker
            const cl = settings.corpusListing.subsetFactory(queryData.corpora)
            const numberOfTokens = queryData.subCqp.split("[").length - 1
            const opts = {
                start: 0,
                end: 24,
                ajaxParams: {
                    cqp: queryData.searchCqp,
                    cqp2: `[_.${queryData.label} contains "${regescape(
                               [point.name, point.countryCode, point.lat, point.lng].join(
                        ";"
                    ))}"]{${numberOfTokens}}`,
                    cqp3: queryData.subCqp,
                    corpus: cl.stringifySelected(),
                    show_struct: _.keys(cl.getStructAttrs()),
                    expand_prequeries: false,
                },
            }
            _.extend(opts.ajaxParams, queryData.within)
            $timeout(
                () =>
                    $rootScope.kwicTabs.push({
                        readingMode: queryData.label === "paragraph__geocontext",
                        queryParams: opts,
                    }),
                0
            )
        }

        s.closeTab = function (idx, e) {
            e.preventDefault()
            s.mapTabs.splice(idx, 1)
            s.closeDynamicTab()
        }
    },
}))
