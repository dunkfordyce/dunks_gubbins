tooomanytabs.ns('util', function() {
var util = this;

util.notification = function(msg) {
    var n = gBrowser.getNotificationBox(
            gBrowser.getBrowserForTab(gBrowser.selectedTab)
    );
    var note = n.appendNotification(
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


});
