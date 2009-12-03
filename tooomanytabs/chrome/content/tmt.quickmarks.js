tooomanytabs.ns('quickmarks', function() {
var qm = this;

var key_map = {};

qm.store_mark = function() {
    function get_next(e) {
        window.removeEventListener('keydown', get_next, true);
        key_map[e.keyCode] = gBrowser.selectedTab;
        tooomanytabs.util.notification(
                "Key set to '"+e.keyCode+"'"
        );
    }

    window.addEventListener('keydown', get_next, true);
};

qm.run_mark = function() {
    function get_next(e) {
        var target = key_map[e.keyCode];
        if( target ) {
            gBrowser.selectedTab = target;
        }
        window.removeEventListener('keydown', get_next, true);
    };

    window.addEventListener('keydown', get_next, true);
};

});
