
var is_drawing = false, //is pen drawing on canvas right now?
    draw_dot = false;   //should we draw a single dot?

//Pen asset graphics for drawing (initialize to base assets)
var pen_stroke_base = new Image(), pen_stroke = new Image(),
    pen_dot_base = new Image(),    pen_dot = new Image();
pen_stroke_base.src = 'assets/drawing/pen_stroke.png';
pen_dot_base.src =    'assets/drawing/pen_dot.png';

function open_canvas($wb_content_div) {

    // Create bounding containers and add to DOM
    var $container = $('<div/>',    { class: 'canvas-container' }),
        $canvas =    $('<canvas/>', { class: 'canvas' });
    $container.append($canvas);
    $wb_content_div.append($container);

    // Set canvas container size once on load to content dimensions less margin
    $container.height($wb_content_div.height() - parseInt($container.css('margin'))*2);
    $container.width($wb_content_div.width() - parseInt($container.css('margin'))*2);

    //Initialise canvas for drawing capabilities
    canvas_init($canvas);

    //The canvas-header contains options for pen types, sizes and colors
    var $header =         $('<div/>', { class: 'header' }), 
        $pen_type_opts =  $('<div/>', { class: 'pen-options types' }), 
        $pen_color_opts = $('<div/>', { class: 'pen-options colors' });
    $header.append($pen_type_opts).append($pen_color_opts);
    $container.append($header);

    //Add a clickable option for each pen size
    $.each(pen_sizes, function (index, pen_size_px) {

        var $pen_size =     $('<div/>', { class: 'pen-option pen-size' }),
            $pen_size_dot = $('<div/>', { class: 'pen-size-dot' });
        $pen_size.append($pen_size_dot);
        $pen_type_opts.append($pen_size);

        //Configure centered dot for displaying pen size
        var dot_size_percent = (20*index + 40) + '%'
        $pen_size_dot.css({
            width:  dot_size_percent,
            height: dot_size_percent,
            left:   ($pen_size.width()  - pen_size_px * 2) / 2 + 'px',
            bottom: ($pen_size.height() - pen_size_px * 2) / 2 + 'px'
        });

        $pen_size.click(pen_size_click_handler($canvas, pen_size_px));
    });

    //Add an option for using an eraser instead of a pen
    var $eraser_opt = $('<div/>', { class: 'pen-option eraser' })
    $pen_type_opts.append($eraser_opt);

    //Toggle erasing by changing pen mode
    $eraser_opt.click(eraser_click_handler($canvas));

    //Add a clickable option for each pen color
    $.each(pen_colors, function (index, pen_color) {

        var $color_opt = $('<div/>', {
            class: 'pen-option color', style: 'background:' + pen_color
        });
        $pen_color_opts.append($color_opt);

        $color_opt.click(pen_color_click_handler($canvas, pen_color));
    });

    choose_pen_color(default_pen_color);
    choose_pen_size(default_pen_size);

    // Resize canvas and opts
    $canvas.attr({ 
        width: $canvas.parent().width(),
        height: $canvas.parent().height()
    });

    resize_canvas_opts($canvas.parent().width());

    return $canvas;
}

function canvas_init($canvas) {

    var ctx = $canvas[0].getContext('2d');
    var offset = $canvas.offset();
    var prev_x = 0, 
        prev_y = 0;

    // The canvas starts off empty
    $canvas.data('empty', true);

    var start_pt_queue = [],
        end_pt_queue = [];

    // Keep track of minimum and maximum drawn bounds
    var bound_min = { x: $canvas.width(),   y: $canvas.height() };
    var bound_max = { x: 0,                 y: 0 };

    // TODO: find better solution; work out bounds on save, maybe?
    function update_bounds(point){

        var pad = 16;
        var px = point.x, py = point.y, 
            cw = $canvas.width(), ch = $canvas.height(); 

        bound_max.x = Math.max(bound_max.x, Math.min(px + pad, cw));
        bound_max.y = Math.max(bound_max.y, Math.min(py + pad, ch));
        bound_min.x = Math.min(bound_min.x, Math.max(px - pad, 0));
        bound_min.y = Math.min(bound_min.y, Math.max(py - pad, 0));

        $canvas.data('bound_min', bound_min);
        $canvas.data('bound_max', bound_max);
    }

    function pen_down(point){
        $canvas.data('empty', false);

        is_drawing = true;
        draw_dot = true;    // Unless user moves mouse, draw a dot

        prev_x = point.x - offset.left;
        prev_y = point.y - offset.top;

        // Record any changes to drawing's bounding box
        update_bounds({x:prev_x, y:prev_y}); 
    }

    function pen_move(point){

        if (is_drawing === true) {
            draw_dot = false;

            // Record any changes to drawing's bounding box
            update_bounds({ x: prev_x, y: prev_y });

            start_pt_queue.push({ x: prev_x, y: prev_y });
            end_pt_queue.push({ x: point.x - offset.left, y: point.y - offset.top });

            prev_x = point.x - offset.left;
            prev_y = point.y - offset.top;
        }
    }

    function pen_up(){
        is_drawing = false;

        if (draw_dot === true) {
            var dot_size = (curr_pen_mode == 'write' ? curr_pen_size : eraser_size) * 1.2;
            var x = prev_x - dot_size / 2,
                y = prev_y - dot_size / 2;

            update_bounds({x:x, y:y});

            ctx.drawImage(pen_dot, x, y, dot_size, dot_size);
        }
    }

    // Handlers for mouse events to trigger pen actions
    $canvas.mousedown(function (e) { pen_down({x:e.pageX, y:e.pageY}); });
    $canvas.mousemove(function (e) { pen_move({x:e.pageX, y:e.pageY}); });
    $(window).mouseup(pen_up);

    $.extend($canvas, {

        to_movable_drawing : function($wb_pane){

            // Get sub-image of minimal drawn bounds from Canvas
            var sub_img = get_subimg($canvas[0], $canvas.data('bound_min'), $canvas.data('bound_max'));
            var data_URI = sub_img.toDataURL("image/png");

            var image_box = { x: 0, y: 0,
                width:  sub_img.width,
                height: sub_img.height }

            var $movable_drawing =
                make_movable_drawing(data_URI, image_box, $wb_pane);
            $movable_drawing.moved = true;

            return $movable_drawing;
        }
    });

    // Update drawing on each frame
    var start_pt, end_pt, distance, angle, x, y;
    function redraw() {
        requestAnimationFrame(redraw);

        if (start_pt_queue.length > 0){

            start_pt = start_pt_queue.shift();
            end_pt =   end_pt_queue.shift();

            // Repeats brush stroke graphic for every pixel between start and end point
            distance = parseInt(Trig.distanceBetween2Points(start_pt, end_pt));
            angle = Trig.angleBetween2Points(start_pt, end_pt);
            
            dx = Math.sin(angle);
            dy = Math.cos(angle);
            for (var z = 0; (z <= distance || z == 0) ; z++) {
                x = start_pt.x + dx * z - curr_pen_size / 2;
                y = start_pt.y + dy * z - curr_pen_size / 2;

                if (curr_pen_mode == 'write')
                    ctx.drawImage(pen_stroke, x, y, curr_pen_size, curr_pen_size);
                else 
                    ctx.drawImage(pen_dot, x, y, eraser_size, eraser_size);
            }
        }
    }
    redraw();
}

