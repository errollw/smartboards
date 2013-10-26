
var DEFAULT_ROOM_ID = 'r_ss20';       // Default room to load if none given in query string

// Responsive page constants
var BREAK_SMALL = 460;                // Width at which app switches to mobile mode

// Global string formats
var PROFILE_PIC_FMT = 'url(images/profile-pic/{0}.jpg)',
    SVG_BG_FMT = 'url(content/{0}.svg)',
    SVG_FMT = 'content/{0}.svg',
    ICONS_FMT = 'url(assets/icons/{0})',
    ICON_HTML_FMT = '<i class="icon-{0}">',
    SCRIPTS_FMT = 'cgi-bin/{0}.py',
    PAGE_TITLE_FMT_EDITOR = 'Editor - {0}',
    PAGE_TITLE_FMT_KIOSK = 'Kiosk - {0}';

// WB-pane specific constants and formats
var HEADER_BTN_BOX_SHADOW_RATIO = 0.08,
    HEADER_BTN_BOX_SHADOW_FMT = 'inset 0 -{0}px rgba(0,0,0,0.2)';

var wb_aspect_ratio =     16 / 10,
    header_height_ratio = 0.045,      // Ratio of header size to wb size
    divider_height_ratio = 0.002,     // Ratio of divider size to wb size
    big_font_ratio = 0.4,
    small_font_ratio = 0.3;

// These are the names of the days of the week
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

function touchEventToPoint(event){
    return {
        x: event.originalEvent.touches[0].pageX,
        y: event.originalEvent.touches[0].pageY
    }
}

// TODO: TIDY UP AND EXTEND
function smartdate(date_ms){
    var date = new Date(parseInt(date_ms)),
        date_now = new Date(Date.now()),
        days = (Date.now() - date_ms) / 86400000;

    var days  = date.getDate(),
        mnths = date.getMonth()+1, //January is 0!
        hrs   = date.getHours(),
        mins  = date.getMinutes();
    if(days<10){days='0'+days}  if(mnths<10){mnths='0'+mnths}  var date_str = '{0}/{1}'.f(days,mnths);
    if(hrs<10){hrs='0'+hrs}     if(mins<10){mins='0'+mins}     var time_str = '{0}:{1}'.f(hrs,mins);

    if (days > 6){
        return '{0}, {1}'.f(date_str, time_str);
    } else {
        var day_str = DAYS[date.getDay()];
        if (date.getDay() == date_now.getDay()){
            day_str = 'Today';
        } else if (date.getDay()+1 == date_now.getDay()){
            day_str = 'Yesterday';
        }
        return '{0}, {1}'.f(day_str, time_str);
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

// Makes a user's SVG url with a dummy query to avoid cached versions
function user_svg_url(u_id){
    return SVG_FMT.f(u_id) + '?nocache=' +new Date().getTime();
}

// For use with prof pic upload previews
function robust_prof_pic_url(url){
    return 'url({0})'.f(url) + ',' + ICONS_FMT.f('icon_no_profile_pic.svg');
};

// See (http://stackoverflow.com/questions/646628/javascript-startswith)
String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
};

function strip_id(id){
    return id.startsWith('u_') || id.startsWith('r_') ? id.slice(2) : id;
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

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 
// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
 
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());