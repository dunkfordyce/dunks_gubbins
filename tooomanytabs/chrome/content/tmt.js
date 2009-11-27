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


(function(tmt) { 

var to_init = [];

tmt.ns = function(name, code) {
    var s = tmt[name] = {};
    try { 
        code.apply(s);
    } catch(e) {
        ddd('error loading', name, e);
    }
    if( s.init ) {
        to_init.push(s);
    } 
};

tmt.init = function() {
    to_init.forEach(function(s) {
        s.init();
    });
};

})(tooomanytabs);
