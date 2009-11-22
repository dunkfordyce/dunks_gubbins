var flower = {};
(function() {

// set this to true to enble the logfunc decorator
var log_func_enabled = true;
// weather to group the log calls or not - can be annoying 
var log_func_group = true;
// function decorator that adds logging
this.logfunc = function(name, func) {
    if( !log_func_enabled ) { return func; }
    var orignal = func;
    if( log_func_group ) {
        return (function() {
            console.groupCollapsed(name, arguments);
            orignal.apply(this, arguments);
            console.groupEnd();
        })
    } else { 
        return (function() {
            console.log(name, arguments);
            orignal.apply(this, arguments);
            console.log('done', name);
        })
    }
};

// if we're initialized
this.initialized = false;
// modules to init later
var to_init = [];
// create a namespace 
this.ns = function(name, func) {
    var ns, obj = this, parts = name.split('.');
    // if there is more than one part get/create those parts 
    if( parts.length > 1) {
        var x = 0;
        while( x < parts.length - 1 ) {
            if( typeof obj[parts[x]] == 'undefined' ) {
                obj = obj[parts[x]] = {};
            } else {
                obj = obj[parts[x]];
            }
            x ++;
        }
        name = parts[parts.length - 1];
    }
    // create the new ns - only if its actually needed 
    if( typeof obj[name] == 'undefined' ) {
        ns = obj[name] = {
            // a subspace ns function 
            ns: function(n, f) {
                flower.ns(name + '.'+n, f);
            }
        };
    } else {
        ns = obj[name];
    }
    // make func optional incase we just want to create an empty namespace
    if( func ) {
        // call the ns function with `this` being the ns object
        func.apply(obj[name]);   
    }
    // initialize if we're already initalized and it hasnt been 
    if( this.initialized && !ns.initialized && ns.init ) {
        ns.init();
        ns.initialized = true;
    } else {
        // add it to the list to be initialized once the main module has 
        // - if it has an init
        if( ns.init ) { 
            to_init.push(ns);
        // or just set it as initialized
        } else { 
            ns.initialized = true;
        }
    }
};

// TODO: lets make this loads more complicated so it can detect
// requires for already loading modules...
this.require_one = function(name, cb) { 
    $.getScript('js/flower.'+name+'.js', cb);   
};

// require one or many modules 
// annoyingly this makes an error running against file://...
// just use `python -m SimpleHTTPServer` instead!
this.require = function(modules, cb) {
    if( typeof modules == 'string' ) {
        return this.require_one(modules, cb);
    }
    // load each module and wait for them to all come back 
    var c = modules.length;
    var require_one = this.require_one;
    $.each(modules, function(idx, m) { 
        require_one(m, function() {
            if( --c == 0 ) {    
                cb();
            }
        });
    });
};

// main entry - loads all modules passed to it 
this.init = this.logfunc('init', 
function(modules) {
    this.initialized = true;
    this.require(modules, function() {
        $.each(to_init, function(idx, ns) {
            ns.init();
            ns.initialized = true;
        });
    });
});

}).apply(flower);
