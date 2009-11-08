var tooomanytabs = {};

function CCSV(cName, ifaceName)
{
    return Components.classes[cName].getService(Components.interfaces[ifaceName]);
}

/*
function ddd() {
    var cs = CCSV("@mozilla.org/consoleservice;1", "nsIConsoleService");
    cs.logStringMessage(Array.prototype.slice.call(arguments).join(" "));
}
function ddlog(msg, obj) {
    try {
        var keys = [], methods = [], k;
        for( k in obj ) { keys.push(k); }
        for( k in obj.prototype ) { methods.push(k); } 
        keys = keys.sort();
        methods = methods.sort();
        ddd(msg, obj, "attr", keys.join(", "), "\nproto", methods.join(", "));
    } catch(e) {
        ddd(msg, obj, "failed print");
    }
}
*/

(function() {

function for_every_tab(func) {
    var wm = CCSV("@mozilla.org/appshell/window-mediator;1", "nsIWindowMediator");
    var browserEnumerator = wm.getEnumerator("navigator:browser");
    while (browserEnumerator.hasMoreElements()) {
        browserWin = browserEnumerator.getNext();
        tabbrowser = browserWin.gBrowser;
        var numTabs = tabbrowser.browsers.length;
        for (var index = 0; index < numTabs; index++) {
            browser = tabbrowser.getBrowserAtIndex(index);
            tab = tabbrowser.tabContainer.childNodes[index]
            func(browserWin, tabbrowser, tab, browser);
        }
    }
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

tooomanytabs.onLoad = function() {
    this.initialized = true;
    this.strings = document.getElementById("tooomanytabs-strings");

    gBrowser.tabContainer.addEventListener("TabOpen", tooomanytabs.onTabOpen, false);

    for_every_tab(function(browserWin, tabbrowser, tab, browser) {
        new BrowserListener(browser);
    });
};

tooomanytabs.onTabOpen = function(event) {
    new BrowserListener(gBrowser.getBrowserForTab(event.target));
};

tooomanytabs.show_close_old_tabs = function(e) {
    var win = window.open("chrome://tooomanytabs/content/tooomanytabs.xul", 
                          "Close Old Tabs", "chrome,centerscreen"); 
    win.addEventListener('load', function() {
        var tabs = win.document.getElementById('tabs');

        var faviconService = CCSV("@mozilla.org/browser/favicon-service;1",
                               'nsIFaviconService');

        var data = [];

        for_every_tab(function(browserWin, tabbrowser, tab, browser) {
            var row = {
                activity: -1, 
                activity_str: '',
                url: browser.currentURI.spec,
                icon: faviconService.getFaviconImageForPage(browser.currentURI),
                tabbrowser: tabbrowser,
                tab: tab
            };
            if( browser.hasAttribute('tooomanytabs_activity') ) {
                row.activity = parseInt(browser.getAttribute('tooomanytabs_activity'), 10);
                row.activity_str = distanceOfTimeInWords(
                    new Date,   
                    new Date(row.activity),
                    true
                );
            }
            data.push(row);
        });

        data.sort(function(a, b) {
            return a.activity - b.activity;    
        });

        function treeView() {
            this.rowCount = data.length;
            this.getCellText = function(row, col) {
                return data[row][col.id];
            };
            this.getCellValue = function(row, col) {
                return data[row][col.id];
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
                    return data[row].icon.spec;
                }
                return null;
            };
            this.getRowProperties = function(row,props){};
            this.getCellProperties = function(row,col,props){};
            this.getColumnProperties = function(colid,col,props){};
            this.cycleHeader = function(col, elem) {};
        }

        tabs.view = new treeView();

        win.document.getElementById('close-selected').addEventListener('click', 
            function() {
                var start = new Object();
                var end = new Object();
                var numRanges = tabs.view.selection.getRangeCount();

                for (var t = 0; t < numRanges; t++){
                    tabs.view.selection.getRangeAt(t,start,end);
                    for (var v = start.value; v <= end.value; v++){
                        var item = data[v];
                        item.tabbrowser.removeTab(item.tab);
                    }
                }
                win.close();
            }, 
            false
        );

        win.document.getElementById('cancel').addEventListener('click',
            function() {
                win.close();
            }, 
            false
        );

    }, false);
};

})();

window.addEventListener("load", tooomanytabs.onLoad, false);
