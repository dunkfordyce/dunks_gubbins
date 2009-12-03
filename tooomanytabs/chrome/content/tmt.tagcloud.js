tooomanytabs.ns('tagcloud', function() {
var tagcloud = this;

var taggingSvc = CCSV(
    "@mozilla.org/browser/tagging-service;1", 
    'nsITaggingService'
);

var histServ = CCSV(
    '@mozilla.org/browser/nav-history-service;1', 
    'nsINavHistoryService'
);  

var tag_items = null;

tagcloud.init = function() {
    var tag_counts = {};

    taggingSvc.allTags.forEach(function(tag) {
        if( !tag ) { return; }
        tag_counts[tag] = taggingSvc.getURIsForTag(tag).length;
    });

    tag_items = [];

    for( var tag in tag_counts ) {
        tag_items.push([tag, tag_counts[tag]]);
    }

};

tagcloud.show = function() {
    var win = window.open(
        "chrome://tooomanytabs/content/tagcloud.xul",
        "tagcloud",
        "chrome,centerscreen"
    );

    var target = null;
    var cloudel = null;

    win.addEventListener('load', function() {
        cloudel = win.document.getElementById('tcloud');
        target = win.document.getElementById('tcloud-inner');

        var selected_tags = [];

        function get_selected_tags() {
            var tags = [];
            selected_tags.forEach(function(el) {
                tags.push(el.childNodes[0].textContent);
            });
            return tags;
        }

        function update_links() {
            var query = histServ.getNewQuery();  
            if( selected_tags.length ) {
                query.tags = get_selected_tags();
            }
              
            var opts = histServ.getNewQueryOptions();  
            opts.queryType = opts.QUERY_TYPE_BOOKMARKS;  
               
            var uri = histServ.queriesToQueryString([query], 1, opts);  
            var tree = win.document.getElementById("results");  
            tree.place = uri;  
            ddlog('tree', tree);
            ddlog('tree.view', tree.view);
        }

        var cloud = new vapourword.Cloud(tag_items, 500, 500, {
            max_font_size: 50,
            min_font_size: 8,
            output_target: target,
            output_document: win.document,
            add_chunk_time: 500,
            add_chunk_size: 5,
        });

        function clear_selection() {
            selected_tags.forEach(function(el) {
                el.style.color = null;
            });
            selected_tags = [];
        }

        target.addEventListener('click', function(e) {
            if( e.target.nodeName != 'div' ) {
                clear_selection();
                update_links();
                return;
            } else {
                if( !e.shiftKey ) {
                    clear_selection();
                } else {
                    var idx = selected_tags.indexOf(e.target);
                    if( idx != -1 ) {
                        selected_tags[idx].style.color = null;
                        selected_tags.splice(idx, 1);
                        update_links();
                        return;
                    }
                }

                selected_tags.push(e.target);
                e.target.style.color = '#000';
                update_links();
            }
        }, false);

        update_links();

    }, false);

    win.addEventListener('resize', function(e) { 
        ddlog('resize', e);
        ddd('sz', cloudel, cloudel.clientWidth, cloudel.clientHeight);
    }, false);

};

});
