tooomanytabs.ns('debug', function() {
var bmsvc = CCSV(
    "@mozilla.org/browser/nav-bookmarks-service;1", 
    'nsINavBookmarksService'
);
var taggingSvc = CCSV(
    "@mozilla.org/browser/tagging-service;1", 
    'nsITaggingService'
);
var ios = CCSV(
    "@mozilla.org/network/io-service;1", 
    'nsIIOService'
);

this.create_test_tags = function() { 
    var tagsA = [
        'python', 
        'javascript',
        'html',
        'go',
        'flash',
        'actionscript',
        'orange',
        'banana'
    ];
    var tagsB = [
        'reference',
        'article',
        'example',
        'demo',
        'library',
        'application',
        'snippet',
        'fork'
    ];
    var tagsC = [
        'article1',
        'article2',
        'article3',
        'article4',
        'article5',
        'article6',
        'article7',
        'article8',
        'article9',
        'topic1',
        'topic2',
        'topic3',
        'topic4',
        'topic5',
        'topic6',
        'topic7',
        'topic8',
        'topic9',
        'post1',
        'post2',
        'post3',
        'post4',
        'post5',
        'post6',
        'post7',
        'post8',
        'post9'
    ];


    var all = [];

    tagsA.forEach(function(a) { 
        tagsB.forEach(function(b) {
            tagsC.forEach(function(c) {
                /*
                var url = "http://"+b+"."+a+"/"+c;
                var uri = ios.newURI(url, null, null);
                bmsvc.insertBookmark(
                    bmsvc.toolbarFolder,
                    uri,
                    bmsvc.DEFAULT_INDEX,
                    a + ' ' + b + ' ' + c
                );

                taggingSvc.tagURI(uri, [a, b, c]);
                ddd('created', url, a, b, c);
                */
                all.push([a, b, c]);
            });
        });
    });

    var ca = 0;

    function add_more() {
        ddd('adding more...', ca, all.length);
        var s = 0;
        while( ((s++) < 100) && (ca < all.length) ) {
            var i = all[ca++], a=i[0], b=i[1], c=i[2];
            ddd('abc', a, b, c);
            var url = "http://"+b+"."+a+"/"+c;
            var uri = ios.newURI(url, null, null);
            bmsvc.insertBookmark(
                bmsvc.toolbarFolder,
                uri,
                bmsvc.DEFAULT_INDEX,
                a + ' ' + b + ' ' + c
            );
            taggingSvc.tagURI(uri, [a, b, c]);
        };
        if( ca < all.length ) {
            setTimeout(add_more, 200);
        }
    }

    add_more();
};

});
