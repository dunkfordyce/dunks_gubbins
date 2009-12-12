tooomanytabs.ns('util', function() {
var util = this;

util.CCSV = function(cName, ifaceName) {
    return Components.classes[cName].getService(Components.interfaces[ifaceName]);
};


util.ddd = function() {
    var cs = util.CCSV("@mozilla.org/consoleservice;1", "nsIConsoleService");
    cs.logStringMessage(Array.prototype.slice.call(arguments).join(" "));
};

util.ddlog = function(msg, obj) {
    try {
        var keys = [], 
            methods = [], 
            k;
        for( k in obj ) { keys.push(k); }
        keys = keys.sort();
        methods = methods.sort();
        util.ddd(msg, obj, "attr", keys.join(", "));
    } catch(e) {
        util.ddd(msg, obj, "failed print", e);
    }
};

util.ddfunc = function(f) {
    function wrapped() {
        util.ddd('doing', f.name);
        f.apply(f.caller, arguments);
        util.ddd('done', f.name);
    }
    return wrapped;
};


util.notification = function(msg) {
    var n = gBrowser.getNotificationBox(
                gBrowser.getBrowserForTab(gBrowser.selectedTab)
        ),
        note = n.appendNotification(
            msg,
            "tmt-notification",
            null,
            n.PRIORITY_INFO_LOW,
            null
    );
    window.setTimeout(function() {
        n.removeNotification(note);
    }, 2000);
};

util.for_every_window = function(func) {
    var wm = util.CCSV("@mozilla.org/appshell/window-mediator;1", "nsIWindowMediator"),
        browserEnumerator = wm.getEnumerator("navigator:browser"),
        browserWin;
    while (browserEnumerator.hasMoreElements()) {
        browserWin = browserEnumerator.getNext();
        if( func(browserWin) ) return true;
    }
};

util.for_every_tab_in_browser = function(browserWin, func) {
    var tabbrowser = browserWin.gBrowser,
        numTabs = tabbrowser.browsers.length,
        browser, tab, index;
    for (index = 0; index < numTabs; index++) {
        browser = tabbrowser.getBrowserAtIndex(index);
        tab = tabbrowser.tabContainer.childNodes[index]
        if( func(browserWin, tabbrowser, index, tab, browser) ) return true;
    }
};

util.for_every_tab = function(func) {
    util.for_every_window(function(browserWin) {
        if( util.for_every_tab_in_browser(browserWin, func) ) return true;
    });
};

util.distanceOfTimeInWords = function(fromTime, toTime, includeSeconds) {
    var fromSeconds = fromTime.getTime(),
        toSeconds = toTime.getTime(),
        distanceInSeconds = Math.round(Math.abs(fromSeconds - toSeconds) / 1000),
        distanceInMinutes = Math.round(distanceInSeconds / 60);

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
};


}); // ns
