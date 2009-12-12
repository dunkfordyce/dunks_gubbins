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

var makeNode = function(doc, name, settings) {
    var node = doc.createElementNS(svgNS, name);
    for (var name in settings) {
        var value = settings[name];
        if (value != null && value != null && 
                (typeof value != 'string' || value != '')) {
            node.setAttribute(name, value);
        }
    }
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


function create_el(cloud, word) {
    var text_el = makeNode(
        cloud.options.output_document, 
        'text', 
        {
            "font-size": word.font_size + "px",
        }
    );
    text_el.appendChild(cloud.options.output_document.createTextNode(word.word));
    cloud.options.output_target.appendChild(text_el);

    word.data = text_el;
    return text_el.getBoundingClientRect();
}


output_svg.calc_size = function(cloud, word) {
    var r = create_el(cloud, word);
    //ddlog('r', r);
    //ddd('r', r.left, r.top, r.right, r.bottom, r.width, r.height);
    //console.log("r", r);
    word.width = r.width;
    word.height = r.height;
    word.offset_x = r.left;
    word.offset_y = r.top;
    //ddd('calc size', word, word.width, word.height, word.offset_x, word.offset_y);
}

output_svg.render_word = function(cloud, word) {
    if( word.added ) {
        //$(word.data).attr({x: word.x-word.offset_x, y: word.y-word.offset_y}).show();
        word.data.setAttribute('x', word.x-word.offset_x);
        word.data.setAttribute('y', word.y-word.offset_y);

        var c_el = makeNode(
            cloud.options.output_document,
            'ellipse',
            {
                cx: word.x-word.offset_x+(word.width/2),
                cy: word.y-word.offset_y,//-(word.height/2),
                rx: (word.width/2) * 1.5,
                ry: (word.height ) * 1.5,
                fill: '#ccc' //url(#cloudgrad)',
                //stroke: 'red',
                //'stroke-width': '2px'
                //style: 
                //    'background: -moz-linear-gradient(blue, white) no-repeat;'

            }
        );
        document.getElementById('bg').appendChild(c_el); //, cloud.options.output_target.childNodes[0]);

        /*
        var rndx = function() { return (Math.random() - 0.5) * word.height; };
        var rndy = function() { return (Math.random()      ) * word.height; };
    
        c_el = makeNode(
            cloud.options.output_document,
            'ellipse',
            {
                cx: word.x-word.offset_x+(word.width/2) + rndx(),
                cy: word.y-word.offset_y-(word.height/2) + rndy(),
                rx: (word.width/2) * 1.5,
                ry: (word.height ) * 1.5,
                //fill: '#777' //url(#cloudgrad)',
                //stroke: 'red',
                //'stroke-width': '2px'
                //style: 
                //    'background: -moz-linear-gradient(blue, white) no-repeat;'

            }
        );
        //cloud.options.output_target.insertBefore(c_el, cloud.options.output_target.childNodes[0]);
        */
    } else {
        //$(word.data).remove();
        word.data.parentNode.removeChild(word.data);
    }
}

})();
