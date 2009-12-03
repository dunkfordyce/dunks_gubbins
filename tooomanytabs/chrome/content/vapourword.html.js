try {
(function() {
vapourword.output_html = {};
var output_html = vapourword.output_html;

if( !vapourword.defaults.output ) { 
    vapourword.defaults.output = output_html;
}

output_html.defaults = {
    output_target: null
}

var ns = {html: 'http://www.w3.org/1999/xhtml'};

output_html.init = function(cloud) {
    var old_opts = cloud.options;
    cloud.options = vapourword.util.obj_clone(output_html.defaults);
    vapourword.util.obj_merge(cloud.options, old_opts);
    /*($(cloud.options.output_target)
        .css({
            width: cloud.options.width+"px",
            height: cloud.options.height+"px",
        })
    );
    */
    cloud.options.output_target.setAttribute('width', cloud.width+'px');
    cloud.options.output_target.setAttribute('height', cloud.height+'px');
    cloud.options.output_target.style.width = cloud.width+'px';
    cloud.options.output_target.style.height = cloud.height+'px';
}

output_html.calc_size = function(cloud, word) {
    word.data = cloud.options.output_document.createElementNS(ns.html, 'div');
    word.data.setAttribute('style', 'position: absolute; font-size:'+word.font_size+'px');
    word.data.appendChild(cloud.options.output_document.createTextNode(word.word));
    cloud.options.output_target.appendChild(word.data);
    var r = word.data.getBoundingClientRect();
    word.width = r.width;
    word.height = r.height;
    word.offset_x = r.left;
    word.offset_y = r.top;
    return word;
}

output_html.render_word = function(cloud, word) {
    if( word.added ) {
        //word.data.css({left: word.x+'px', top: word.y+'px'}).show();
        word.data.style.left = word.x+'px';
        word.data.style.top = word.y+'px';
    } else {
        //word.data.remove();
    }
}

})();
} catch(e) {
    ddd('error loading cloudyword html', e);
}
