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
        'actionscript'
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

    tagsA.forEach(function(a) { 
        tagsB.forEach(function(b) {
            var url = "http://"+b+"."+a;
            var uri = ios.newURI(url, null, null);
            bmsvc.insertBookmark(
                bmsvc.toolbarFolder,
                uri,
                bmsvc.DEFAULT_INDEX,
                a + ' ' + b
            );

            taggingSvc.tagURI(uri, [a, b]);
            ddd('created', url, a, b);
        });
    });

};

});
