tooomanytabs.ns('filter', function() {
    var filter = this;

    var $label, $textbox;
    var filtering = false;

    filter.init = function() {
        $label   = document.getElementById('tooomanytabs-filter-label');
        $textbox = document.getElementById('tooomanytabs-filter-textbox');
    };

    filter.open_search = ddfunc(function() {
        $textbox.hidden = false;
        $label.hidden = true;
        $textbox.focus();
    });

    filter.close_search = function() {
        if( filtering ) {
            return;
        }
        $textbox.hidden = true;
        $textbox.value = '';
        $label.hidden = false;
        for_every_tab_in_browser(window, function(_, _, _, tab, _) { 
            tab.hidden = false;
        });
    };

    filter.keydown = function(e) {
        if( e.keyCode == 13 || e.keyCode == 27 ) {
            filter.close_search();
        }
    };

    filter.filter = function(value) {
        value = value.toLowerCase();

        var selected_one = false;

        for_every_tab_in_browser(window, function(_a, tabbrowser, _b, tab, browser) {
            if( !value || 
                browser.currentURI.spec.toLowerCase().indexOf(value) != -1 ||
                browser.contentDocument.title.toLowerCase().indexOf(value) != -1
                ) {
                tab.hidden = false;
                if( !selected_one ) {
                    filtering = true;
                    selected_one = true;
                    tabbrowser.selectedTab = tab;
                    $textbox.focus();
                    filtering = false;
                    tabbrowser.selectedBrowser.hidden = false;
                }
            } else { 
                tab.hidden = true;
            }
        });

        if( !selected_one ) {
            ddd('not selected one');
            var tabbrowser = window.gBrowser;
            ddlog('tabbrowser', tabbrowser);
            tabbrowser.selectedBrowser.hidden = true;
        }
    };

});
