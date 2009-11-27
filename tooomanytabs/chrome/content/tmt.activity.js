tooomanytabs.ns('activity', function() {
var activity = this;

function for_every_window(func) {
    var wm = CCSV("@mozilla.org/appshell/window-mediator;1", "nsIWindowMediator");
    var browserEnumerator = wm.getEnumerator("navigator:browser");
    var browserWin;
    while (browserEnumerator.hasMoreElements()) {
        browserWin = browserEnumerator.getNext();
        if( func(browserWin) ) return true;
    }
};

function for_every_tab_in_browser(browserWin, func) {
    var tabbrowser = browserWin.gBrowser;
    var numTabs = tabbrowser.browsers.length;
    var browser, tab;
    for (var index = 0; index < numTabs; index++) {
        browser = tabbrowser.getBrowserAtIndex(index);
        tab = tabbrowser.tabContainer.childNodes[index]
        if( func(browserWin, tabbrowser, index, tab, browser) ) return true;
    }
};

function for_every_tab(func) {
    for_every_window(function(browserWin) {
        if( for_every_tab_in_browser(browserWin, func) ) return true;
    });
};

function distanceOfTimeInWords(fromTime, toTime, includeSeconds) {
    var fromSeconds = fromTime.getTime();
    var toSeconds = toTime.getTime();
    var distanceInSeconds = Math.round(Math.abs(fromSeconds - toSeconds) / 1000)
    var distanceInMinutes = Math.round(distanceInSeconds / 60)
    if (distanceInMinutes <= 1) {
        if (!includeSeconds)
            return (distanceInMinutes == 0) ? 'less than a minute' : '1 minute'
        if (distanceInSeconds < 5)
            return 'less than 5 seconds'
        if (distanceInSeconds < 10)
            return 'less than 10 seconds'
        if (distanceInSeconds < 20)
            return 'less than 20 seconds'
        if (distanceInSeconds < 40)
            return 'half a minute'
        if (distanceInSeconds < 60)
            return 'less than a minute'
        return '1 minute'
    }
    if (distanceInMinutes < 45)
        return distanceInMinutes + ' minutes'
    if (distanceInMinutes < 90)
        return "about 1 hour" 
    if (distanceInMinutes < 1440)
        return "about " + (Math.round(distanceInMinutes / 60)) + ' hours'
    if (distanceInMinutes < 2880)
        return "1 day" 
    if (distanceInMinutes < 43200)
        return (Math.round(distanceInMinutes / 1440)) + ' days'
    if (distanceInMinutes < 86400)
        return "about 1 month" 
    if (distanceInMinutes < 525600)
        return (Math.round(distanceInMinutes / 43200)) + ' months'
    if (distanceInMinutes < 1051200)
        return "about 1 year" 
    return "over " + (Math.round(distanceInMinutes / 525600)) + ' years'
}


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

    for_every_tab(function(browserWin, tabbrowser, tabidx, tab, browser) {
        new BrowserListener(browser);
    });
};

activity.show_close_old_tabs = function(e) {
    var win = window.openDialog("chrome://tooomanytabs/content/tooomanytabs.xul", 
                                "Close Old Tabs", "chrome,centerscreen"); 

    win.addEventListener('load', function() {
        var tabs = win.document.getElementById('tabs');

        var faviconService = CCSV("@mozilla.org/browser/favicon-service;1",
                               'nsIFaviconService');

        var all_tabs = [];

        for_every_tab(function(browserWin, tabbrowser, tabidx, tab, browser) {
            var row = {
                activity: -1, 
                activity_str: '',
                url: browser.currentURI.spec,
                icon: faviconService.getFaviconImageForPage(browser.currentURI),
                tabbrowser: tabbrowser,
                tab: tab,
                title: browser.contentDocument.title
            };
            if( browser.hasAttribute('tooomanytabs_activity') ) {
                row.activity = parseInt(browser.getAttribute('tooomanytabs_activity'), 10);
                row.activity_str = distanceOfTimeInWords(
                    new Date,   
                    new Date(row.activity),
                    true
                );
            }
            all_tabs.push(row);
        });

        all_tabs.sort(function(a, b) {
            return a.activity - b.activity;    
        });

        var data = [];

        function filter_tabs(pattern) {
            data = [];
            all_tabs.forEach(function(row, idx) {
                if( !pattern || 
                    row.title.indexOf(pattern) != -1 || 
                    row.url.indexOf(pattern) != -1 
                ) {
                    data.push(idx);
                }
            });
        }
    
        filter_tabs();

        function treeView() {
            this.treebox = null;
            this.rowCount = data.length;
            this.getCellText = function(row, col) {
                return all_tabs[data[row]][col.id];
            };
            this.getCellValue = function(row, col) {
                return all_tabs[data[row]][col.id];
            };
            this.setTree = function(treebox) {
                this.treebox = treebox;
            };
            this.isEditable = function(row, col) {
                return col.editable;
            };
            this.isContainer = function(row){ return false; };
            this.isSeparator = function(row){ return false; };
            this.isSorted = function(){ return false; };
            this.getLevel = function(row){ return 0; };
            this.getImageSrc = function(row,col){ 
                if( col.id == 'url' ) {
                    return all_tabs[data[row]].icon.spec;
                }
                return null;
            };
            this.getRowProperties = function(row,props){};
            this.getCellProperties = function(row,col,props){};
            this.getColumnProperties = function(colid,col,props){};
            this.cycleHeader = function(col, elem) {};
        }

        tabs.view = new treeView();

        function for_each_selected(cb) {
            var start = new Object();
            var end = new Object();
            var numRanges = tabs.view.selection.getRangeCount();

            for (var t = 0; t < numRanges; t++){
                tabs.view.selection.getRangeAt(t,start,end);
                for (var v = start.value; v <= end.value; v++){
                    if( cb(all_tabs[data[v]]) === false ) {
                        return;
                    }
                }
            }
        }

        win.addEventListener('dialogaccept', 
            function() {
                for_each_selected(function(item) {
                    item.tabbrowser.selectedTab = item.tab;
                });
                return true;
            }, 
            false
        );

        win.addEventListener('dialogextra1',
            function() {
                for_each_selected(function(item) {
                    item.tabbrowser.removeTab(item.tab);
                });
                win.close();
            },
            false
        );

        var filter_box = win.document.getElementById('filter');
        filter_box.addEventListener('command', 
            function() {
                filter_tabs(filter_box.value);
                tabs.view = new treeView();
            }, 
            false
        );

    }, false);

};

});
