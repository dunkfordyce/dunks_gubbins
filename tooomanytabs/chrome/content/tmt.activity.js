tooomanytabs.ns('activity', function() {
var activity = this,
    util = tooomanytabs.util;

function BrowserListener(browser) {
    this.browser = browser;

    this.handleEvent = function() {
        browser.setAttribute('tooomanytabs_activity', ''+(new Date).getTime());
    };

    this.browser.addEventListener('click', this, false);
    this.browser.addEventListener('scroll', this, false);
    this.browser.addEventListener('load', this, false);
    this.browser.addEventListener('keydown', this, false);

    // call it once now to set the initial time 
    this.handleEvent();
}


onTabOpen = function(event) {
    new BrowserListener(gBrowser.getBrowserForTab(event.target));
};

activity.init = function() {
    this.initialized = true;
    this.strings = document.getElementById("tooomanytabs-strings");

    gBrowser.tabContainer.addEventListener("TabOpen", onTabOpen, false);

    util.for_every_tab(function(browserWin, tabbrowser, tabidx, tab, browser) {
        new BrowserListener(browser);
    });
};

}); // ns
