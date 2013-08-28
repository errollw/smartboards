// System is either idle (just viewing), moving a movable drawing, or drawing
var edit_modes = ['idle', 'moving', 'drawing'];
var default_edit_mode = edit_modes[0];
var curr_edit_mode = default_edit_mode;

var wb_aspect_ratio =     16 / 10,
    header_height_ratio = 0.045,      // Ratio of header size to wb size
    divider_height_ratio = 0.002,
    big_font_ratio = 0.4,
    small_font_ratio = 0.3;

// Global vars for only one active canvas and one movable_drawing
var $canvas,
    $movable_drawing;

var DEFAULT_ROOM_ID = 'r_ss20';

var wb_panes = [];

//Runs once page is loaded
$(function () {

    var $container =      $('body'),
        $wb_container =   $('#center-col');

    function resize() {
        $wb_container.css({
            width :     $container.height() / wb_aspect_ratio,
            height :    $container.height(),
        });
    };
    $(window).resize(resize);

    // Check query string for requested room_ID
    var query_r_id = getQueryVariable('r_id', DEFAULT_ROOM_ID);

    // Get JSON for chosen room
    $.getJSON( SCRIPTS_FMT.f('get_room'), {r_id : query_r_id},

        // For each user in the room, add a new wb_pane for them
        function(room) {
            $.each(room.users, function(index, user){
                wb_panes.push(wb_pane($wb_container, user))
            }); 
            $(window).resize(); // Calls all resize handlers
        }
    );

});

// Resets all wb-panes on the screen
function reset_all_panes(){
    $.each(wb_panes, function(ind, $pane){
        $pane.reset();
    });
}

function wb_pane($container, user) {

    //Create new whiteboard pane
    var $new_wb_pane =  $('<div/>', { class: 'wb-pane flex-col' });
    $container.append($new_wb_pane);

    //Create header flex-row and description elements
    var $header =       $('<div/>', { class: 'header' }),
        $profile_pic =  $('<div/>', { class: 'profile-pic' }).css('background-image', robust_prof_pic(user.id)),
        $description =  $('<div/>', { class: 'description' }),
        $title =        $('<p/>',   { class: 'title' }).text(user.name),
        $subtitle =     $('<p/>',   { class: 'subtitle' }).text(user.status);
    $description.append($title).append($subtitle);
    $header.append($profile_pic).append($description);
    $new_wb_pane.append($header).append($('<div/>', {class:'divider'}));

    //Create header buttons
    var $btn_draw =     $('<button/>', {class: 'button'}).html('<i class="icon-pencil"></i>'),
        $btn_accept =   $('<button/>', {class: 'button green'}).html('<i class="icon-move "></i>'),
        $btn_upload =   $('<button/>', {class: 'button green'}).html('<i class="icon-save"></i>'),
        $btn_trash =    $('<button/>', {class: 'button red'  }).html('<i class="icon-trash"></i>');
    $header.append($btn_accept).append($btn_upload).append($btn_trash).append($btn_draw);

    //Create content pane for displaying whiteboard SVG and drawing with pen
    var $content = $('<div/>', { class: 'wb-content flex-col'});
    $new_wb_pane.append($content);

    // Header's height grows with wb
    function resize() {

        // Adjust header and divider height
        $header.height($container.height() * header_height_ratio);
        $('.divider', $new_wb_pane).height($container.height() * divider_height_ratio);

        // Force square buttons
        $profile_pic.width($header.height());
        $header.children('.button').width($header.height());

        // Adjust font-sizes to fit header
        $header.children('.button').css('font-size', $header.height() * big_font_ratio);
        $title.css(   'font-size', $header.height() * big_font_ratio);
        $subtitle.css('font-size', $header.height() * small_font_ratio);
    }
    $(window).resize(resize);

    if(user.website_url !== undefined)
        insert_iframe($content, user.website_pos, user.website_url);

    // Load and place user-specific SVG
    var $svg_holder = $('<div/>', { class: 'svg-holder'});
    $content.append($svg_holder);
    
    var svg_wrapper;
    $svg_holder.svg({ loadURL: SVG_FMT.f(user.id),
        onLoad: function(w){
            svg_wrapper = w;
            $.data(w._svg, 'u_id', user.id);

            function resize(){
                svg_wrapper.change(svg_wrapper.root(),{ 
                    width: $content.width(), height: $content.height() });
            }
            $(window).resize(function(){resize();});
            resize();

            $('image',svg_wrapper.root()).css('pointer-events','all')
        }
    });

    $new_wb_pane.on('click', 'svg > image',
        svg_img_click_handler($new_wb_pane));

    // WB-PANE EXTENDED METHODS
    $.extend($new_wb_pane, {

        set_edit_mode: function(edit_mode) {
            curr_edit_mode = edit_mode;

            // Toggle button visiblility based on 
            $btn_draw.toggle(   edit_mode === 'idle');
            $btn_upload.toggle( edit_mode === 'moving');
            $btn_accept.toggle( edit_mode === 'drawing')
            $btn_trash.toggle(  edit_mode === 'drawing' || edit_mode === 'moving');

            $new_wb_pane.toggleClass('faded', edit_mode === 'drawing');
        },

        reset: function() {

            resize();

            if (!(typeof $canvas === "undefined"))
                $canvas.parent().remove();

            $new_wb_pane.set_edit_mode('idle')
        },

        get_svg_wrapper: function(){return svg_wrapper},

        content: $content
    });

    $new_wb_pane.reset();

    $btn_draw.click(function () {
        reset_all_panes();

        //Generate and display canvas elements
        $canvas = open_canvas($content);
        $new_wb_pane.set_edit_mode('drawing')
    });

    $btn_accept.click(function () {

        // If the canvas is empty, cancel
        if ($canvas.data('empty') === true){
            $new_wb_pane.reset();
            return;
        }

        // Add movable drawing from canvas
        $movable_drawing = $canvas.to_movable_drawing($new_wb_pane, svg_wrapper);
        $content.append($movable_drawing);
        $canvas.parent().remove();

        // Center the movable drawing after adding it
        $movable_drawing.css({
            top:  ($content.height() - $movable_drawing.height()) / 2,
            left: ($content.width() - $movable_drawing.width()) / 2
        });

        $new_wb_pane.set_edit_mode('moving');
    });

    $btn_upload.mouseup(function(e) {
        e.stopPropagation();

        $movable_drawing.place(); 

        $new_wb_pane.set_edit_mode('idle');
    });

    $btn_trash.mouseup(function(e) {
        e.stopPropagation();

        if (!(typeof $movable_drawing === "undefined"))
            $movable_drawing.trash();

        $new_wb_pane.reset();
    });

    return $new_wb_pane;
}