
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
    };
}

function pen_size_click_handler($canvas, pen_size_px){
    return function() {
        if (curr_pen_mode == 'erase') {
            choose_pen_mode($canvas, 'write');
            choose_pen_color(curr_pen_color);
        }
        choose_pen_size(pen_size_px);
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
    };
}