tooomanytabs.group_tabs = function() {
    /*
    for_every_window(function(browserWin) {

        for_every_tab_in_browser(browserWin, 
            function(browserWin, tabbrowser, tabidx, tab, browser) {
                var uri = browser.currentURI;                   
                var insert_index = -1;
                for_every_tab_in_browser(browserWin,
                    function(_, _, othertabidx, _, otherbrowser) {
                        var otheruri = otherbrowser.currentURI;
                        if( otheruri.scheme == uri.scheme && 
                            otheruri.host == uri.host ) {
                            insert_index = othertabidx;
                        } else if( insert_index != -1 ) {
                            return true;
                        }
                    }
                );

                if( insert_index != -1 ) {
                    var container = tabbrowser.tabContainer;
                    if( insert_index + 1 >= container.childNodes.length;
                    var targettab = container.childNodes[insert_index+1];
                    tabbrowser.tabContainer.insertBefore(
                }
            }
        );
    });

    for_every_tab(function(browserWin, tabbrowser, tab, browser) {
        var uri = browser.currentURI;
    });
    */
};
