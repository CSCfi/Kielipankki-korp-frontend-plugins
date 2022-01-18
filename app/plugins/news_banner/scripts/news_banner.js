
// Plugin news_banner
//
// An AngularJS module implementing a closeable news banner for
// important news, typically at the very top of the Korp window, read
// from a JSONP source by default specified by settings.newsBannerUrl.
// Once the banner is closed, it is not shown before new news are
// added and the page is reloaded.
//
// Based on Korp's newsdesk.js (SB-newsdesk 1.0b).
// Requirements: trust filter


// Plugin class is used in this case only to allow disabling the
// plugin

class NewsBanner {

    constructor () {
        // Plugin name
        this.name = "news_banner"
    }

    // Initialize is called only for enabled plugins, so the AngularJS
    // module is not initialized if this plugin is disabled
    initialize () {
        // Register AngularJS module as a dependency to the Korp app
        plugins.registerAngularModule("newsbanner", []).directive(
            "newsBanner",
            ($window, $location) => ({
                template: `
                    <div id="news_banner" ng-if="showBanner">
                        <div id="news_banner_content">
                            <div class="newsbanner-item" ng-repeat="item in newsItems">
                                <div class="newsbanner-item-content"
                                     ng-bind-html="item.h[currentLang] | trust"></div>
                            </div>
                        </div>
                        <div id="news_banner_close" ng-click="closeBanner()">×</div>
                    </div>
                `,
                restrict: "EA",
                scope: {
                    urlsetting: "=",
                    storage: "=",
                    callback: "=",
                    newsItems: "<",
                },
                link(scope, elem, attr) {
                    const s = scope

                    // Use default values if not specified as attributes
                    s.urlsetting = s.urlsetting || "newsBannerUrl"
                    s.storage = s.storage || "korp_newsbanner_last_closed"
                    // callback value would appear to have to be different
                    // from the value for the newsdesk
                    s.callback = s.callback || "newsbannerdata"

                    const newsBannerUrl = $window.settings[s.urlsetting]
                    s.showBanner = (newsBannerUrl != null)

                    if (! s.showBanner) {
                        return
                    }
                    s.newsItems = []

                    // Initialize data from the URL newsBannerUrl
                    function initData() {
                        let d
                        s.lastClosed = localStorage.getItem(s.storage)
                        // Initially, set lastClosed to one year back
                        if (! s.lastClosed) {
                            d = new Date()
                            d.setFullYear(d.getFullYear() - 1)
                            s.lastClosed = d.toISOString().slice(0, 10)
                        }
                        // c.log("banner last closed", s.storage, s.lastClosed)
                        // Get the news data
                        $.ajax({
                            method: "GET",
                            url: newsBannerUrl,
                            async: false,
                            jsonpCallback: s.callback,
                            contentType: "application/javascript",
                            dataType: "jsonp",
                            success(json) {
                                const currentDate =
                                      new Date().toISOString().slice(0, 10)
                                s.newsItems = _.filter(json, (newsItem) => {
                                    // Include news that are from today or
                                    // earlier but after the date when the
                                    // banner was last closed and that either
                                    // have no expiration date or the
                                    // expiration date is today or later.
                                    // TODO: Allow configuring if future news
                                    // should be shown or not
                                    return (newsItem.d <= currentDate &&
                                            newsItem.d > s.lastClosed &&
                                            (! newsItem.e ||
                                             newsItem.e >= currentDate))
                                })
                                s.newsItems = _.map(s.newsItems, (newsItem) => {
                                    // Incorporate the date and title to the body
                                    // of the news item
                                    for (const lang in newsItem.h) {
                                        newsItem.h[lang] = `
                                    <p class="newsbanner-item-heading">
                                      <span class="newsbanner-item-date">${newsItem.d}</span>
                                      <span class="newsbanner-item-title">${newsItem.t[lang]}</span>
                                    </p>
                                    ${newsItem.h[lang]}`
                                    }
                                    return newsItem
                                })
                                // Show banner if there are news to show
                                s.showBanner = s.newsItems.length > 0
                            },
                            error(e) {
                                console.log("error, couldn't fetch banner news", e)
                            },
                        })
                        s.showBanner = s.newsItems.length > 0
                    }

                    // Close the banner and save today as the the last closed
                    // date to localStorage
                    s.closeBanner = function () {
                        s.showBanner = false
                        d = new Date()
                        s.lastClosed = d.toISOString().slice(0, 10)
                        localStorage.setItem(s.storage, s.lastClosed)
                    }

                    s.currentLang =
                        $location.search().lang || settings.defaultLanguage

                    // Change language whenever the UI language is changed
                    s.$watch(
                        () => $location.search().lang,
                        (lang) => (
                            s.currentLang = lang || settings.defaultLanguage)
                    )

                    initData()

                },
            })
        )

    }

}


plugins.register(new NewsBanner())
