try {
(function(jQuery) {

jQuery.noConflict();

jQuery.fn.click = function(fn) {
    this.each(function() {
        var doc = this.ownerDocument;
        var evt = doc.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, doc.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        var canceled = !this.dispatchEvent(evt);
    });
};

var old_init = jQuery.fn.init;
jQuery.fn.init = function(selector, context) {
    jQuery.log('init', selector, context);
    if ( !context && !selector.nodeType ) {
        context = jQuery.test.context.window.document;
        jQuery.log('init context', context);
    }
    return old_init(selector, context);
};

//window.$ = function(selector, context) {
//    return jQuery(selector, context || jQuery.test.context.document);
//};

jQuery.test = {};

jQuery.test.context = {
    window: null,
    testcase: null
};

jQuery.test.TestCase = function(commands) {
    this.commands = commands || [];
    this.command_idx = 0;
};
jQuery.test.TestCase.prototype.run = function(window) {
    jQuery.test.context.window = window;
    jQuery.test.context.document = window.document;
    jQuery.log("input", $('input'));
    /*
    while( this.command_idx < this.commands.length ) {
        var command = this.commands[this.command_idx];
        FBL.ddd(command ? command : 'no command');
        if( command ) {
            try {
                eval(command); 
            } catch(e) {
                jQuery.log(e);
            }
        }
        this.command_idx += 1;
    }
    */
};

window.firearms = window.$ = jQuery;

})(jQuery);
} catch(e) {
alert(e);
}

