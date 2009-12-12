tooomanytabs.ns('tabwindow', function() {
var tw = this,
    util = tooomanytabs.util;

tw.show = function(e) {
    var win = window.openDialog("chrome://tooomanytabs/content/tooomanytabs.xul", 
                                "Close Old Tabs", "chrome,centerscreen"); 

    win.addEventListener('load', function() {
        var tabs = win.document.getElementById('tabs');

        var faviconService = CCSV("@mozilla.org/browser/favicon-service;1",
                               'nsIFaviconService');

        var all_tabs = [];

        util.for_every_tab(function(browserWin, tabbrowser, tabidx, tab, browser) {
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
                row.activity_str = util.distanceOfTimeInWords(
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

}); // ns
