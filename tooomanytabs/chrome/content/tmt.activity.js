tooomanytabs.ns('activity', function() {
var activity = this,
    util = tooomanytabs.util;

function BrowserListener(browser) {
    var that = this;
    this.browser = browser;

    this.handleEvent = function() {
        browser.setAttribute('tooomanytabs_activity', ''+(new Date).getTime());
    };

    ['click', 'scroll', 'load', 'keydown'].forEach(function(e) {
        browser.addEventListener(e, that, false);
    });

    // call it once now to set the initial time 
    this.handleEvent();
}


activity.init = function() {
    gBrowser.tabContainer.addEventListener("TabOpen", function(e) {
        new BrowserListener(gBrowser.getBrowserForTab(e.target));
    }, false);

    util.for_every_tab(function(browserWin, tabbrowser, tabidx, tab, browser) {
        new BrowserListener(browser);
    });
};

}); // ns
