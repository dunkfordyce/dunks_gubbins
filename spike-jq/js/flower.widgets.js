flower.ns('widgets', function() {
var m = this;

/*
load a new widget appending content to $parent
if id_or_obj is a string then the data is got from the interweb
if id_or_obj is an array like [widget_id, {...}] data is loaded from the object
*/
this.load = flower.logfunc('widget load', 
function(id_or_obj, $parent, cb) {
    function load_it(id, data) { 
        // cant load a widget without a type 
        if( !data.type ) {
            console.warn('data has no type!', id);
            return;
        }

        // check we have code to create the widget - could ajax in new 
        // code here if we dont know about it yet ...
        var creator = m.factory[data.type];
        if( !creator ) {
            console.warn('unknown widget type', data.type, id);
        } else {
            // finally create whatever it is 
            creator(id, $parent, data);
        }
    }
    // if its an obj then the data is inline - we can just use that 
    if( typeof id_or_obj == "object" ) {
        load_it(id_or_obj[0], id_or_obj[1]);
    // string id - we should load it async
    } else { 
        $.getJSON(id_or_obj, function(data) { 
            load_it(id_or_obj, data);
        });
    }       

});

// there should be a func off here for every widget type
// other scripts can append to here too if they want to 
// extend the widgets that can be created
// could also dynamicly load stuff into here 
this.ns('factory', function() {
    // create an accordion widget 
    this.accordion = flower.logfunc('create accordion',
    function(id, $parent, data) {
        var $el = ($('<div/>')
            .attr('id', id)
            .appendTo($parent)
        );
        $.each(data.items, function(sec_name) {
            $el.append('<h3><a href="#">'+sec_name+'</a></h3>');
            var $div = $('<div/>').appendTo($el);

            flower.widgets.load(data.items[sec_name], $div);
        });

        $el.accordion({
            fillSpace: true
        });
    });

    // create a list of links 
    this.linklist = flower.logfunc('create linklist',
    function(id, $parent, data) {
        var $ul = $('<ul/>').appendTo($parent);
        $.each(data.items, function(idx, item) {
            ($('<li/>')
                .append($('<a/>')
                    .text(item[0])
                    .attr('href', item[1])
                )
                .appendTo($ul)
            );
        });
    });

    // create a list of icons 
    this.iconlist = flower.logfunc('create iconlist',
    function(id, $parent, data) {
        var $div = $('<div/>').appendTo($parent);
        // if items_url is set we grab the items from some location
        if( data.items_url ) {
            $.getJSON('widgets', function(items) {
                $.each(items, function(idx, item) {
                    ($('<div/>')
                        .text(item.title)
                        .appendTo($div)
                        .append($('<img/>')
                            .attr('src', item.icon)
                        )
                    );
                });
            });
            //});
        } else {
            // load items from items attr
        }
    });

    // create a tab 
    this.tab = flower.logfunc('create tab', 
    function(id, $parent, data) {
        var $tab_body = ($('<div/>')
            .attr('id', id)
            .appendTo($parent.find('.ui-layout-content'))
        );

        $parent.find('.ui-layout-content').tabs('add', '#'+id, data.label);

        if( data.windows && data.windows.length ) {
            $.each(data.windows, function(idx, win) {
                flower.widgets.load(win, $tab_body);
            });
        }
    });

    // create a calendar widget
    this.calendar = flower.logfunc('create calendar', 
    function(id, $parent, data) {
        // dumb way to hack in dialogs 
        ($('<div/>')
            .attr('title', 'Calendar')
            .win({
                height: data.height,
                width: data.width,
                position: [data.left, data.top],
                modal: false,
                appendTo: $parent
            })
            // fix the parenting because there is no other way...
            //.parents('[role=dialog]')
            //.appendTo($parent)
        );
    });

    // create an rss widget 
    this.rss = flower.logfunc('create rss',
    function(id, $parent, data) {
        // dumb way to hack in dialogs 
        ($('<div/>')
            .attr('title', 'RSS')
            .win({
                height: data.height,
                width: data.width,
                position: [data.left, data.top],
                modal: false,
                appendTo: $parent
            })
            // fix the parenting because there is no other way...
            //.parents('[role=dialog]')
            //.appendTo($parent)
        );
    });
});

});
