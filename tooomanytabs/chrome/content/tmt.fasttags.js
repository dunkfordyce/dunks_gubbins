tooomanytabs.ns('fasttags', function() {
var ft = this;

var taggingSvc = CCSV("@mozilla.org/browser/tagging-service;1", 'nsITaggingService');
var bmsvc = CCSV("@mozilla.org/browser/nav-bookmarks-service;1", 'nsINavBookmarksService');
var ios = CCSV("@mozilla.org/network/io-service;1", 'nsIIOService');

var stop_words = "a,able,about,across,after,all,almost,also,am,among,an,and,any,are,as,at,be,because,been,but,by,can,cannot,could,dear,did,do,does,either,else,ever,every,for,from,get,got,had,has,have,he,her,hers,him,his,how,however,i,if,in,into,is,it,its,just,least,let,like,likely,may,me,might,most,must,my,neither,no,nor,not,of,off,often,on,only,or,other,our,own,rather,said,say,says,she,should,since,so,some,than,that,the,their,them,then,there,these,they,this,tis,to,too,twas,us,wants,was,we,were,what,when,where,which,while,who,whom,why,will,with,would,yet,you,your".split(",");

var these_tags;

function get_tags() {
    var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
    var sel = browser.contentWindow.getSelection().toString();
    if( !sel ) { return []; }
    var words = sel.split(/[^a-zA-Z0-9]+/);
    var uniq = {};
    words.forEach(function(word) {
        word = word.toLowerCase();
        if( stop_words.indexOf(word) == -1 ) {
            uniq[word.toLowerCase()] = true;
        }
    });
    var ret = [];
    for( var w in uniq ) {
        ret.push(w);
    }
    return ret;
}


ft.init = function() {
    var context_menu = document.getElementById('contentAreaContextMenu');
    var menu_item = document.getElementById('tooomanytabs-tag-this');
    context_menu.addEventListener('popupshowing', function() {
        these_tags = get_tags();
        if( these_tags.length ) {
            menu_item.label = "Tag: "+these_tags.join(", ");
            menu_item.hidden = false;
        } else {
            menu_item.hidden = true;
        }
    }, false);
};

ft.tag_selection = function() {
    var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
    var sel = browser.contentWindow.getSelection().toString();
    var currentURI = ios.newURI(browser.currentURI.spec, null, null);

    if (!bmsvc.isBookmarked(currentURI)) {
        bmsvc.insertBookmark(bmsvc.toolbarFolder, currentURI, bmsvc.DEFAULT_INDEX, browser.contentDocument.title);
    }

    taggingSvc.tagURI(currentURI, these_tags);
};


});

