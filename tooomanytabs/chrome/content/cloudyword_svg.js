(function() {
var output_svg;
vapourword.output_svg = output_svg = {};

if( !vapourword.defaults.output ) { 
    vapourword.defaults.output = output_svg;
}

output_svg.defaults = {
    output_target: null,
    output_document: null
}

var svgNS = 'http://www.w3.org/2000/svg';

var makeNode = function(doc, parent, name, settings) {
    var node = doc.createElementNS(svgNS, name);
    for (var name in settings) {
        var value = settings[name];
        if (value != null && value != null && 
                (typeof value != 'string' || value != '')) {
            node.setAttribute(name, value);
        }
    }
    parent.appendChild(node);
    return node;
}


output_svg.init = function(cloud) {
    var old_opts = cloud.options;
    cloud.options = vapourword.util.obj_clone(output_svg.defaults);
    vapourword.util.obj_merge(cloud.options, old_opts);
    ddlog('opts', cloud.options);
    /*
    ($(cloud.options.output_target)
        .css({
            width: cloud.options.width+"px",
            height: cloud.options.height+"px",
        })
    );
    */
    cloud.options.output_target.setAttribute('width', cloud.width+"px");
    cloud.options.output_target.setAttribute('height', cloud.height+"px");
}


output_svg.calc_size = function(cloud, word) {
    word.data = makeNode(
        cloud.options.output_document, 
        cloud.options.output_target, 
        'text', 
        {
            "font-size": word.font_size + "px",
        }
    );
    word.data.appendChild(word.data.ownerDocument.createTextNode(word.word));
    
    var r = word.data.getBoundingClientRect();
    ddlog('r', r);
    ddd('r', r.left, r.top, r.right, r.bottom, r.width, r.height);
    //console.log("r", r);
    word.width = r.width;
    word.height = r.height;
    word.offset_x = r.left;
    word.offset_y = r.top;
    ddd('calc size', word, word.width, word.height, word.offset_x, word.offset_y);
}


output_svg.render_word = function(cloud, word) {
    if( word.added ) {
        //$(word.data).attr({x: word.x-word.offset_x, y: word.y-word.offset_y}).show();
        word.data.setAttribute('x', word.x-word.offset_x);
        word.data.setAttribute('y', word.y-word.offset_y);
    } else {
        //$(word.data).remove();
        word.data.parentNode.removeChild(word.data);
    }
}

})();
