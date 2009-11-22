flower.ns('widgets', function() {

/*
load a new widget appending content to $parent
if id_or_obj is a string then the data is got from the interweb
if id_or_obj is an array like [widget_id, {...}] data is loaded from the object
*/
this.load = flower.logfunc('widget load', 
function(id_or_obj, $parent, cb) {
    var data, id;
    // if its an obj then the data is inline - we can just use that 
    if( typeof id_or_obj == "object" ) {
        id = id_or_obj[0];
        data = id_or_obj[1];
    // string id - we should load it 
    } else { 
        id = id_or_obj;
        // this should be some $.getJSON call
        // just use the example json for the moment 
        data = exdata[id];
        if( typeof data == 'undefined' ) {
            console.warn('data for widget id', id, 'not found');
            return;
        }
    }       

    // cant load a widget without a type 
    if( !data.type ) {
        console.warn('data has no type!', id);
        return;
    }

    // check we have code to create the widget - could ajax in new 
    // code here if we dont know about it yet ...
    var creator = this.factory[data.type];
    if( !creator ) {
        console.warn('unknown widget type', data.type, id);
    } else {
        // finally create whatever it is 
        creator(id, $parent, data);
    }
});

// there should be a func off here for every widget type
// other scripts can append to here too if they want to 
// extend the widgets that can be created
// could also dynamicly load stuff into here 
this.ns('factory', function() {
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

    this.iconlist = flower.logfunc('create iconlist',
    function(id, $parent, data) {
        var $div = $('<div/>').appendTo($parent);
        if( data.items_url ) {
            // just get the data from the example for the moment..
            var items = exdata.widgets;    
            //$.getJSON(data.items_url, null, function(items) {
            $.each(items, function(idx, item) {
                ($('<div/>')
                    .text(item.title)
                    .appendTo($div)
                    .append($('<img/>')
                        .attr('src', item.icon)
                    )
                );
            });
            //});
        } else {
            // load items from items attr
        }
    });

    this.tab = flower.logfunc('create tab', 
    function(id, $parent, data) {
        var $tab_body = ($('<div/>')
            .attr('id', id)
            .appendTo($parent.find('.ui-layout-content'))
        );

        $parent.tabs('add', '#'+id, data.label);

        if( data.windows && data.windows.length ) {
            $.each(data.windows, function(idx, win) {
                flower.widgets.load(win, $tab_body);
            });
        }
    });

    this.calendar = flower.logfunc('create calendar', 
    function(id, $parent, data) {
        ($('<div/>')
            .attr('title', 'Calendar')
            .dialog({
                height: data.height,
                width: data.width,
                position: [data.left, data.top],
                modal: false
            })
            .parents('[role=dialog]')
            .appendTo($parent)
        );
    });

    this.rss = flower.logfunc('create rss',
    function(id, $parent, data) {
        ($('<div/>')
            .attr('title', 'RSS')
            .dialog({
                height: data.height,
                width: data.width,
                position: [data.left, data.top],
                modal: false
            })
            .parents('[role=dialog]')
            .appendTo($parent)
        );
    });
});

});
