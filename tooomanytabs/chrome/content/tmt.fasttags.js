tooomanytabs.ns('fasttags', function() {
var ft = this,
    prefs = tooomanytabs.prefs('fasttags'),
    taggingSvc = CCSV(
        "@mozilla.org/browser/tagging-service;1", 
        'nsITaggingService'
    ),
    bmsvc = CCSV(
        "@mozilla.org/browser/nav-bookmarks-service;1", 
        'nsINavBookmarksService'
    ),
    ios = CCSV(
        "@mozilla.org/network/io-service;1", 
        'nsIIOService'
    ),
    stop_words = "a,able,about,across,after,all,almost,also,am,among,an,and,any,are,as,at,be,because,been,but,by,can,cannot,could,dear,did,do,does,either,else,ever,every,for,from,get,got,had,has,have,he,her,hers,him,his,how,however,i,if,in,into,is,it,its,just,least,let,like,likely,may,me,might,most,must,my,neither,no,nor,not,of,off,often,on,only,or,other,our,own,rather,said,say,says,she,should,since,so,some,than,that,the,their,them,then,there,these,they,this,tis,to,too,twas,us,wants,was,we,were,what,when,where,which,while,who,whom,why,will,with,would,yet,you,your".split(","),
    user_ignores = [];


/*
given a string return a list of tags optionally filtering them 
through the filter function if one is provided
*/
function string_to_tags(str, filter) {
    // quick optimization
    if( !str ) { 
        return []; 
    }

    var words = str.split(/[^a-zA-Z0-9'-]+/),
        uniq = {},
        ret = [],
        w;

    words.forEach(function(word) {
        word = word.trim().toLowerCase();
        if( !word || word.length < 3 ) { return; } 
        if( stop_words.indexOf(word) == -1 ) {
            if( !filter || filter(word) ) { 
                uniq[word.toLowerCase()] = true;
            }
        } 
    });

    for( w in uniq ) {
        ret.push(w);
    }
    ret.sort();
    return ret;
}


/*
load tags to ignore from a user file
*/
function load_user_ignores() {
    var user_ignores_fn = DirIO.get('Home');
    user_ignores_fn.append('.tmt.fasttags.ignore.txt');

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


/*
helper to add and remove tags from a uri
if the uri is not bookmarked already then its bookmarked
*/
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
}


/* 
return automatically calculated tags for a document
*/
function auto_calc_tags(doc, initial) {
    var strings = initial || [];
    Array.forEach(document.getElementsByTagName, function(el) {
        if( el.name == 'keywords' || el.name == 'description' ) {
            strings.push(el.content);
        } 
    });
    if( document.title && document.title.length ) {
        strings.push(document.title);
    }
    return string_to_tags(strings.join(" "), function(tag) {
        return (user_ignores.indexOf(tag) == -1);
    });
}


/*
fasttags init
*/
ft.init = function() {
    var context_menu = document.getElementById('contentAreaContextMenu'),
        menu_popup = document.getElementById('tooomanytabs-tag-popup'),
        menu_item = document.getElementById('tooomanytabs-tag-item'),
        changed_tags = false,
        currentURI;

    load_user_ignores();

    context_menu.addEventListener('popupshowing', function() {
        var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
        currentURI = ios.newURI(browser.currentURI.spec, null, null);
        var old_tags = taggingSvc.getTagsForURI(currentURI, {}), 
            selection = browser.contentWindow.getSelection().toString(),
            // automatically calc tags if there is no selection
            // otherwise use the text selection to calc tags
            new_tags = ( !selection.length ? 
                auto_calc_tags(browser.contentDocument) :
                string_to_tags(selection, function(tag) { 
                        return !( 
                            user_ignores.indexOf(tag) != -1 ||
                            old_tags.indexOf(tag) != -1
                        )
                })
            );

        // hide the menu item if there is nothing to show 
        if( old_tags.length == 0 && new_tags.length == 0 ) {
            menu_item.hidden = true;
            return;
        }
    
        menu_item.hidden = false;
        
        // clear the old items
        while ( menu_popup.childNodes.length >= 1 ) {
            menu_popup.removeChild( menu_popup.firstChild );       
        } 

        // helper to create menuitems
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

        if( old_tags.length ) {
            old_tags.sort();
            old_tags.forEach(function(tag) {
                make_item(tag, true);
            });
        }
        if( new_tags.length ) {
            new_tags.sort();
            new_tags.forEach(function(tag) {
                make_item(tag, false);
            });
        }

        changed_tags = false;
    }, false);

    context_menu.addEventListener('popuphidden', function() {
        if( changed_tags ) {
            var add = [], remove = [];
            // find which tags we are adding and removing
            for( var i=0; i!= menu_popup.childNodes.length; i++ ) {
                var child = menu_popup.childNodes[i];
                if( child.getAttribute('checked') ) {
                    add.push(child.label);
                } else {
                    remove.push(child.label);
                }
            }
            tag_untag(currentURI, add, remove);
        }
    }, false);

    menu_popup.addEventListener('command', function(e) {
        changed_tags = true;
    }, false);
};


/*
autotag function - uses page title and keywords to generate keywords
*/
ft.autotag = function() {
    var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab),
        tags = auto_calc_tags(browser.contentDocument),
        currentURI = ios.newURI(browser.currentURI.spec, null, null);
    tooomanytabs.util.notification('Auto tag: '+tags.join(","));
    tag_untag(currentURI, tags, null);
};


}); //ns

