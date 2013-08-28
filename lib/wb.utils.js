// Some global string formats
var PROFILE_PIC_FMT = 'url(images/profile-pic/{0}.jpg)',
    SVG_BG_FMT = 'url(content/{0}.svg)',
    SVG_FMT = 'content/{0}.svg',
    ICONS_FMT = 'url(assets/icons/{0})',
    ICON_HTML_FMT = '<i class="icon-{0}">',
    SCRIPTS_FMT = 'cgi-bin/{0}.py';

var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// For String formatting
// See (http://stackoverflow.com/questions/1038746/equivalent-of-string-format-in-jquery)
String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

// TODO: TIDY UP AND EXTEND
function smartdate(date_ms){
    var date = new Date(parseInt(date_ms));
    var date_now = new Date(Date.now());
    var days = (Date.now() - date_ms) / 86400000;

    if (days > 6){
        return '{0}, {1}'.f(date.toLocaleDateString("en-GB"), date.toLocaleTimeString("en-GB"));
    } else {
        var day_str = DAYS[date.getDay()];
        if (date.getDay() == date_now.getDay()){
            day_str = 'Today';
        } else if (date.getDay()+1 == date_now.getDay()){
            day_str = 'Yesterday';
        }
        return '{0}, {1}'.f(day_str, date.toLocaleTimeString("en-GB"));
    }
}

// Pure javascript method of retrieving query variables
// See http://css-tricks.com/snippets/javascript/get-url-variables/
function getQueryVariable(variable, def_val) {

        def_val = typeof def_val !== 'undefined' ? def_val : false;     // Assign default retval if none given

        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0; i<vars.length; i++) {                             // Loops through each &key=val pair until searched-for variable is found
           var pair = vars[i].split("=");
           if (pair[0] == variable) return pair[1];
        }
        return(def_val);
}

// For showing either a profile pic, or a placeholder using CSS
function robust_prof_pic(u_id){
    return PROFILE_PIC_FMT.f(u_id) + ',' + ICONS_FMT.f('icon_no_profile_pic.svg');
};

// For use with prof pic upload previews
function robust_prof_pic_url(url){
    return 'url({0})'.f(url) + ',' + ICONS_FMT.f('icon_no_profile_pic.svg');
};

// See (http://stackoverflow.com/questions/646628/javascript-startswith)
String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
};

function strip_id(id){
    return id.startsWith('u_') ? id.slice(2) : id;
}

// See http://stackoverflow.com/questions/13013563/jquery-ajax-call-throws-an-error-when-an-xml-containing-escaped-ampersand
function escapeXML(string){

    var str = string;
    str = str.replace(/\&/g,"&amp;");
    str = str.replace(/\>/g,"&gt;");
    str = str.replace(/\</g,"&lt;");
    str = str.replace(/\"/g,"&quot;");
    str = str.replace(/\'/g,"&apos;");

    return str;
}

// Tints an image using HTML5 canvas
function tint_img(img, color) {

    // Temporary canvas buffer for image tinting operation
    var buff = document.createElement("canvas");
    buff.width = 	img.width;
    buff.height = 	img.height;
    var buff_ctx = buff.getContext("2d");

    // Draw the base image to be tinted
    buff_ctx.globalAlpha = 1;
    buff_ctx.globalCompositeOperation = 'copy';
    buff_ctx.drawImage(img, 0, 0);

    // Draw a colored rectangle on top with source-in for tinting
    // (see http://www.html5canvastutorials.com/advanced/html5-canvas-global-composite-operations-tutorial/)
    buff_ctx.globalCompositeOperation = 'source-in';
    buff_ctx.beginPath();
    buff_ctx.rect(0, 0, buff.width, buff.height);
    buff_ctx.fillStyle = color;
    buff_ctx.fill();

    return buff;
}

function get_subimg(img, bound_min, bound_max) {

    // Temporary canvas buffer of the sub-img size
    var buff = document.createElement("canvas");
    buff.width = 	bound_max.x - bound_min.x;
    buff.height = 	bound_max.y - bound_min.y;
    var buff_ctx = buff.getContext("2d");

    // Copy sub-rect from img into the buffer
    buff_ctx.globalCompositeOperation = 'copy';
    buff_ctx.drawImage( img,
                        bound_min.x, bound_min.y, buff.width, buff.height,
                        0, 0, buff.width, buff.height);

    return buff;
}

var Trig = {
    distanceBetween2Points: function (point1, point2) {
        var dx = point2.x - point1.x;
        var dy = point2.y - point1.y;
        return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    },

    angleBetween2Points: function (point1, point2) {
        var dx = point2.x - point1.x;
        var dy = point2.y - point1.y;
        return Math.atan2(dx, dy);
    }
};