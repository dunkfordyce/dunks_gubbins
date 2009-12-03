var tooomanytabs = {};

function CCSV(cName, ifaceName)
{
    return Components.classes[cName].getService(Components.interfaces[ifaceName]);
}


function ddd() {
    var cs = CCSV("@mozilla.org/consoleservice;1", "nsIConsoleService");
    cs.logStringMessage(Array.prototype.slice.call(arguments).join(" "));
}
function ddlog(msg, obj) {
    try {
        var keys = [], methods = [], k;
        for( k in obj ) { keys.push(k); }
        for( k in obj.prototype ) { methods.push(k); } 
        keys = keys.sort();
        methods = methods.sort();
        ddd(msg, obj, "attr", keys.join(", "), "\nproto", methods.join(", "));
    } catch(e) {
        ddd(msg, obj, "failed print", e);
    }
}

function ddfunc(f) {
    function wrapped() {
        ddd('doing', f.name);
        f.apply(f.caller, arguments);
        ddd('done', f.name);
    }
    return wrapped;
}




try { 
(function(tmt) { 


var to_init = [];

tmt.ns = function(name, code) {
    var s = tmt[name] = { }; 
    try { 
        code.apply(s);
    } catch(e) {
        ddd('error loading', name, e);
    }
    if( s.init ) {
        to_init.push(s);
    } 
};

/*
if(0) {
function _imp(name) {
    var parts = name.split('.');
    var o = window;
    while( parts.length ) {
        
    }
};

tmt.ns = function() {
    var name = arguments[0], opts, code;
    if( arguments.length == 2 ) {
        code = arguments[1];
        opts = {};
    } else if( arguments.length == 3 ) {
        opts = arguments[1];
        code = arguments[2];
    }
    
    nso = {};
    if( opts.imports && opts.imports.length ) {
        opts.imports.forEach(function(name) {

        });
    }
    
};
}
*/

tmt.prefs = function(name) {
    return (
        CCSV("@mozilla.org/preferences-service;1", 'nsIPrefService')
        .getBranch("extensions.tooomanytabs."+name+'.')
    );
};

tmt.init = function() {
    to_init.forEach(function(s) {
        s.init();
    });
};

})(tooomanytabs);
} catch(e) {
ddd('failing tmt!', e);
}
ddd('done tmt');
