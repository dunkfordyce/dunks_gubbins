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

function count_map_to_list(d) {
    var ret = [];
    for( var k in d ) {
        ret.push([k, d[k]]);
    }
    return ret;
}


var tag_items = null;

tagcloud.init = function() {
    ddd('tagcloud init');
    var tag_counts = {};

    taggingSvc.allTags.forEach(function(tag) {
        if( !tag ) { return; }
        tag_counts[tag] = taggingSvc.getURIsForTag(tag).length;
    });

    tag_items = count_map_to_list(tag_counts);
    ddd('tagcloud done');
};

tagcloud.show = function() {
    var win = window.open(
        "chrome://tooomanytabs/content/tagcloud.xul",
        "tagcloud",
        "chrome,centerscreen"
    );

    var target = null;
    var cloudel = null;
    var results_tree = null;

    win.addEventListener('load', function() {
        cloudel = win.document.getElementById('tcloud');
        target = win.document.getElementById('tcloud-inner');
        results_tree = win.document.getElementById("results");  

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
            results_tree.place = uri;  
            if( selected_tags.length ) {
                get_result_tags();
                create_cloud();
            }
        }

        function get_result_tags() {
            var root = results_tree.getResult().root;

            var ret = {};

            for( var i=0; i!= root.childCount; i++ ) {
                var child = root.getChild(i);
                //ddlog('child', child);
                //ddlog('child.tags', child.tags);
                ddd(i, child.uri, child.tags);
                child.tags.split(',').forEach(function(tag) {
                    tag = tag.trim();
                    if( !tag ) { return; }
                    ret[tag] = ret[tag] ? ret[tag] + 1 : 1;
                });
            }

            // not entirely sure why we have to do this here but if
            // we dont we get items left over from the last cloud...
            tag_items.length = 0;
            tag_items = count_map_to_list(ret);
            ddd('tag_items', tag_items);
        }

        function create_cloud() { 
            target.innerHTML = '';

            var cloud = new vapourword.Cloud(tag_items, 1500, 1500, {
                max_font_size: 50,
                min_font_size: 8,
                output_target: target,
                output_document: win.document,
                add_chunk_time: 500,
                add_chunk_size: 5,
            });
        }

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

        create_cloud();
        update_links();

    }, false);

    win.addEventListener('resize', function(e) { 
        ddlog('resize', e);
        ddd('sz', cloudel, cloudel.clientWidth, cloudel.clientHeight);
    }, false);

};

tagcloud.show2 = function() {

    var win = window.open(
        "chrome://tooomanytabs/content/tagcloud.xul",
        "tagcloud",
        "chrome,centerscreen"
    );

    var target = null;
    var cloudel = null;
    var results_tree = null;

    win.addEventListener('load', function() {
        cloudel = win.document.getElementById('tcloud');
        target = win.document.getElementById('tcloud-inner');
        results_tree = win.document.getElementById("results");  
        
        var selected_tags = [];        
        var items = tag_items;

        function create_cloud() { 
            target.innerHTML = '';

            var cloud = new vapourword.Cloud(items, 500, 500, {
                max_font_size: 50,
                min_font_size: 8,
                output_target: target,
                output_document: win.document,
                add_chunk_time: 50,
                add_chunk_size: 20,
            });
        }

        function update_bookmarks() {
            var query = histServ.getNewQuery();  
            if( selected_tags.length ) {
                ddd('querying for tags', selected_tags);
                query.tags = selected_tags;
            } else {
                ddd('querying all tags');
            }
              
            var opts = histServ.getNewQueryOptions();  
            opts.queryType = opts.QUERY_TYPE_BOOKMARKS;  
               
            var uri = histServ.queriesToQueryString([query], 1, opts);  
            results_tree.place = uri;  
        }

        function gather_tags() {
            var root = results_tree.getResult().root;
            var ret = {};

            for( var i=0; i!= root.childCount; i++ ) {
                var child = root.getChild(i);
                if( child.tags && child.tags.length ) {
                    child.tags.split(',').forEach(function(tag) {
                        tag = tag.trim();
                        if( !tag ) { return; }
                        ret[tag] = ret[tag] ? ret[tag] + 1 : 1;
                    });
                }
            }

            // not entirely sure why we have to do this here but if
            // we dont we get items left over from the last cloud...
            items.length = 0;
            items = count_map_to_list(ret);
        }

        target.addEventListener('click', function(e) {
            if( e.target.nodeName == 'div' ) {
                selected_tags.push(e.target.childNodes[0].textContent);
            } else {
                selected_tags.pop();
            }
            update_bookmarks();       
            gather_tags();
            create_cloud();
        }, false);

        create_cloud();       


    }, false);

};


});
