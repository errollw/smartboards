
//Pen size options in pixels
var pen_sizes = ['8', '12', '16'], 
    default_pen_size = pen_sizes[1], 
    curr_pen_size = default_pen_size, 
    eraser_size = 24;

//Pen color options as hex colors
var pen_colors = ['#231f20', '#e11e2e', '#009444', '#14426f'],
    default_pen_color = pen_colors[0],
    curr_pen_color = default_pen_color;

//User either writes or erases the whiteboard
var pen_modes = ['write', 'erase'],
    default_pen_mode = pen_modes[0],
    curr_pen_mode = default_pen_mode;
    

function choose_pen_color(color) {

    curr_pen_color = color;

    // Tint base pen stroke and dot assets for drawing
    pen_stroke  = tint_img(pen_stroke_base, color);
    pen_dot     = tint_img(pen_dot_base, color);

    //Un-toggle other pen-colors
    $('.pen-option.color').removeClass('toggled');

    //Toggle selected style for color opt in canvas-header options panel
    var ind = pen_colors.indexOf(color);
    $('.pen-option.color:eq(' + ind + ')').addClass('toggled');

    //Set pen-size dots to chosen color
    var $pen_size_dots = $('.pen-size-dot');
    $pen_size_dots.each(function () {
        $(this).css('background', color);
    });
}

function choose_pen_size(size) {

    curr_pen_size = size;

    //Un-toggle other pen-sizes
    $('.pen-option.pen-size').removeClass('toggled');

    //Toggle selected size in canvas-header options panel
    var ind = pen_sizes.indexOf(size);
    $('.pen-option.pen-size:eq(' + ind + ')').addClass('toggled');
}

function choose_pen_mode($canvas, mode) {

    curr_pen_mode = mode;
    ctx = $canvas[0].getContext('2d');

    if (mode == 'write') {
        ctx.globalCompositeOperation = 'source-over';

        //Un-toggle eraser button
        $('.pen-option.eraser').removeClass('toggled');

    } else if (mode == 'erase') {
        ctx.globalCompositeOperation = 'destination-out';

        //Toggle eraser button, un-toggle color and size buttons
        $('.pen-option.eraser').addClass('toggled');
        $('.pen-option.pen-size').removeClass('toggled');
        $('.pen-option.color').removeClass('toggled');
    }
}


// Option button click handlers

function pen_color_click_handler($canvas, pen_color){
    return function() {
        if (curr_pen_mode == 'erase') {
            choose_pen_mode($canvas, 'write');
            choose_pen_size(curr_pen_size);
        }
        choose_pen_color(pen_color);
        resize_canvas_opts($canvas.width());
    };
}

function pen_size_click_handler($canvas, pen_size_px){
    return function() {
        if (curr_pen_mode == 'erase') {
            choose_pen_mode($canvas, 'write');
            choose_pen_color(curr_pen_color);
        }
        choose_pen_size(pen_size_px);
        resize_canvas_opts($canvas.width());
    };
}

function eraser_click_handler($canvas){
    return function(){
        if (curr_pen_mode == 'erase') {
            choose_pen_mode($canvas, 'write');
            choose_pen_size(curr_pen_size);
            choose_pen_color(curr_pen_color);
        } else {
            choose_pen_mode($canvas, 'erase');
        }
        resize_canvas_opts($canvas.width());
    };
}


var PEN_OPTION_SIZE_RATIO = 0.08,
    PEN_OPTION_TOGGLE_RATIO = 0.11,
    PEN_OPTION_COLOR_SHADOW_FMT = 'inset 0 0 0 {0}px rgba(0,0,0,0.2)',
    PEN_SIZE_DOT_SHADOW_FMT = 'inset 0px -{0}px 0 0 rgba(0,0,0,0.2)'

function resize_canvas_opts(container_width){

    container_width = typeof container_width !== 'undefined' ? container_width : false;  

    $('.pen-option').css({
        width: container_width * PEN_OPTION_SIZE_RATIO,
        height: container_width * PEN_OPTION_SIZE_RATIO
    });

    $('.pen-option.pen-size').each(function(){

        var dotsize = (($(this).index()+1)*0.15+0.2)*$(this).width();
        $('.pen-size-dot', $(this)).css({
            width:  dotsize,
            height: dotsize,
            left:   $(this).width()/2 - dotsize/2,
            bottom: $(this).width()/2 - dotsize/2,
            boxShadow: PEN_SIZE_DOT_SHADOW_FMT.f($(this).width()*0.06)
        });
    });

    $('.pen-option.color').css('box-shadow',PEN_OPTION_COLOR_SHADOW_FMT.f(container_width * 0.005));

    $('.pen-option.toggled').height(container_width * PEN_OPTION_TOGGLE_RATIO);
}