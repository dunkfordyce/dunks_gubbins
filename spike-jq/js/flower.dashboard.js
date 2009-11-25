flower.require('widgets', function() {
flower.ns('dashboard', function() {
var m = this;

// module initialization
this.init = function() {
    this.layout = $('body').layout({
        west: {
            size:         300,
            //onresize:     function () { $("#accordion1").accordion("resize"); }
        },
        north: {
            spacing_open:           1,       // cosmetic spacing
            togglerLength_open:     0,       // HIDE the toggler button
            togglerLength_closed:   -1,      // "100%" OR -1 = full width of pane
            resizable:              false,
            slidable:               false,
        }
    });

    // temp loading from example data
    $.getJSON('dashboard', function(data) { 
        m.load(data);
    });
};

// load a dashboard from `data`
this.load = flower.logfunc('dashboard load', function(data) {
    var that = this;
    this.name = data.name;
    this.creator = data.creator;
    this.created = data.created;
    this.theme = data.theme;

    this.panes = {};

    $.each(data.panes, function(name) {
        var $pane_el = $('.ui-layout-'+name);
        if( !$pane_el.length ) {
            console.warn('pane element not found', name);
            return true;
        } 

        that.panes[name] = {
            $element: $pane_el,
        };

        // init the pane if there is a function for it 
        var pane_loader = that.pane_loaders[name];
        if( pane_loader ) {
            pane_loader(that.panes[name], data.panes[name]);
        } else {
            console.log('no pane loader for', name);
        }
    });
});

this.ns('pane_loaders', function() {
    this.center = function(pane, data) {
        pane.$element.find('.ui-layout-content').tabs();

        $.each(data.tabs, function(idx, id) {
            flower.widgets.load(id, pane.$element);
        });
    };

    this.west = function(pane, data) {
        $.each(data.items, function(idx, id) {
            flower.widgets.load(id, pane.$element);
        });
    };
});


}) // namespace
}) // require
;



