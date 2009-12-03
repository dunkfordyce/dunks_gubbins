tooomanytabs.ns('fasttags', function() {
var ft = this;
var prefs = tooomanytabs.prefs('fasttags');
var taggingSvc = CCSV(
    "@mozilla.org/browser/tagging-service;1", 
    'nsITaggingService'
);
var bmsvc = CCSV(
    "@mozilla.org/browser/nav-bookmarks-service;1", 
    'nsINavBookmarksService'
);
var ios = CCSV(
    "@mozilla.org/network/io-service;1", 
    'nsIIOService'
);
var stop_words = "a,able,about,across,after,all,almost,also,am,among,an,and,any,are,as,at,be,because,been,but,by,can,cannot,could,dear,did,do,does,either,else,ever,every,for,from,get,got,had,has,have,he,her,hers,him,his,how,however,i,if,in,into,is,it,its,just,least,let,like,likely,may,me,might,most,must,my,neither,no,nor,not,of,off,often,on,only,or,other,our,own,rather,said,say,says,she,should,since,so,some,than,that,the,their,them,then,there,these,they,this,tis,to,too,twas,us,wants,was,we,were,what,when,where,which,while,who,whom,why,will,with,would,yet,you,your".split(",");

var user_ignores = [];
var user_ignores_fn = DirIO.get('Home');
user_ignores_fn.append('.tmt.fasttags.ignore.txt');

function string_to_tags(str, filter) {
    if( !str ) { 
        return []; 
    }
    var words = str.split(/[^a-zA-Z0-9'-]+/);
    var uniq = {};

    words.forEach(function(word) {
        word = word.trim().toLowerCase();
        if( !word || word.length < 3 ) { return; } 
        if( stop_words.indexOf(word) == -1 ) {
            if( !filter || filter(word) ) { 
                uniq[word.toLowerCase()] = true;
            }
        } 
    });
    var ret = [];
    for( var w in uniq ) {
        ret.push(w);
    }
    ret.sort();
    return ret;
}

function load_user_ignores() {
    var fstream = CCSV(
            "@mozilla.org/network/file-input-stream;1", 
            "nsIFileInputStream"
    );
    var cstream = CCSV(
            "@mozilla.org/intl/converter-input-stream;1", 
            "nsIConverterInputStream"
    );
    fstream.init(user_ignores_fn, -1, 0, 0);
    cstream.init(fstream, "UTF-8", 0, 0);
    var str = {};
    cstream.readString(-1, str);
    cstream.close();

    user_ignores = string_to_tags(str.value);
}

load_user_ignores();


function tag_untag(uri, add, remove) {
    var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab);

    if (!bmsvc.isBookmarked(uri)) {
        bmsvc.insertBookmark(
            bmsvc.toolbarFolder, 
            uri, 
            bmsvc.DEFAULT_INDEX, 
            browser.contentDocument.title
        );
    }

    if( add && add.length ) { 
        taggingSvc.tagURI(uri, add);
    }
    if( remove && remove.length ) { 
        taggingSvc.untagURI(uri, remove);
    }
};

ft.init = function() {
    var context_menu = document.getElementById('contentAreaContextMenu');
    var menu_popup = document.getElementById('tooomanytabs-tag-popup');

    var currentURI;
    var changed_tags = false;

    context_menu.addEventListener('popupshowing', function() {
        var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
        currentURI = ios.newURI(browser.currentURI.spec, null, null);
        var old_tags = taggingSvc.getTagsForURI(currentURI, {}); 
        var new_tags = string_to_tags(
            browser.contentWindow.getSelection().toString(),
            function(tag) { 
                return !( 
                    user_ignores.indexOf(tag) != -1 ||
                    old_tags.indexOf(tag) != -1
                )
            }
        );
        
        old_tags.sort();
        new_tags.sort();

        while ( menu_popup.childNodes.length >= 1 ) {
            menu_popup.removeChild( menu_popup.firstChild );       
        } 

        function make_item(tag, checked) {
            var el = document.createElement('menuitem');
            el.setAttribute('label', tag);
            el.setAttribute('type', 'checkbox');
            el.setAttribute('closemenu', 'none');
            if( checked ) {
                el.setAttribute('checked', 'true');
            }
            menu_popup.appendChild(el);
        }

        old_tags.forEach(function(tag) {
            make_item(tag, true);
        });
        new_tags.forEach(function(tag) {
            make_item(tag, false);
        });
        changed_tags = false;
    }, false);

    context_menu.addEventListener('popuphidden', function() {
        if( changed_tags ) {
            var add = [], remove = [];
            for( var i=0; i!= menu_popup.childNodes.length; i++ ) {
                var child = menu_popup.childNodes[i];
                if( child.getAttribute('checked') ) {
                    add.push(child.label);
                } else {
                    remove.push(child.label);
                }
            }
            tag_untag(currentURI, add, remove);
            changed_tags = false;
        }
    }, false);

    menu_popup.addEventListener('command', function(e) {
        changed_tags = true;
    }, false);
};


ft.autotag = function() {
    var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
    var tag_str = browser.contentDocument.title;
    var keywords = Sizzle("meta[name=keywords]", browser.contentDocument);
    if( keywords.length ) {
        tag_str += " "+keywords[0].content;
    }
    var tags = string_to_tags(tag_str, function(tag) {
        return user_ignores.indexOf(tag) == -1;
    });
    var currentURI = ios.newURI(browser.currentURI.spec, null, null);
    tooomanytabs.util.notification('Auto tag: '+tags.join(","));
    tag_untag(currentURI, tags, null);
};


}); //ns

