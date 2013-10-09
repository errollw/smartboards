// System is either idle (just viewing), moving a movable drawing, or drawing
var edit_modes = ['idle', 'moving', 'drawing', 'typing'];
var default_edit_mode = edit_modes[0];
var curr_edit_mode = default_edit_mode;

var wb_aspect_ratio =     16 / 10,
    header_height_ratio = 0.045,      // Ratio of header size to wb size
    divider_height_ratio = 0.002,     // Ratio of divider size to wb size
    big_font_ratio = 0.4,
    small_font_ratio = 0.3,
    mobile_font_ratio = 0.6;

var is_mobile = false,
    BREAK_SMALL = 460;

// Global vars
var $canvas,
    $movable_drawing;

// Default room to load if none given in query string
var DEFAULT_ROOM_ID = 'r_ss20';

var wb_panes = [];

//Runs once page is loaded
$(function () {

    var $container =      $('body'),
        $wb_container =   $('#center-col');

    // Check query string for requested room_ID, else load default
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

var HEADER_BTN_BOX_SHADOW_RATIO = 0.08,
    HEADER_BTN_BOX_SHADOW_FMT = 'inset 0 -{0}px rgba(0,0,0,0.2)';

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
    var $btn_draw =     $('<button/>', {class: 'blue'}).html(ICON_HTML_FMT.f('pencil')),
        $btn_accept =   $('<button/>', {class: 'green'}).html(ICON_HTML_FMT.f('move')),
        $btn_upload =   $('<button/>', {class: 'green'}).html(ICON_HTML_FMT.f('save')),
        $btn_trash =    $('<button/>', {class: 'red'  }).html(ICON_HTML_FMT.f('trash'));
    $header.append($btn_accept).append($btn_upload).append($btn_trash).append($btn_draw);

    //Create content pane for displaying whiteboard SVG and drawing with pen
    var $content = $('<div/>', { class: 'wb-content'});
    $new_wb_pane.append($content);

    if(user.website_url !== undefined)
        insert_iframe($content, user.website_pos, user.website_url);

    // Load and place user-specific SVG
    var $svg_holder = $('<div/>', { class: 'svg-holder'});
    $content.append($svg_holder);
    
    var svg_wrapper;
    function load_svg(){
        $svg_holder.svg({ loadURL: SVG_FMT.f(user.id),
            onLoad: function(w){
                svg_wrapper = w;
                $.data(w._svg, 'u_id', user.id);

                svg_wrapper.change(svg_wrapper.root(),{ 
                    width: $content.width(), height: $content.height()
                });

                // Allow pointer events on images within the SVG
                $('image',svg_wrapper.root()).css('pointer-events','all')
            }
        });
    }
    load_svg();

    // Handle click events on IMAGES insdie the SVG
    $new_wb_pane.on('click', 'svg > image', svg_img_click_handler($new_wb_pane));

    // Transparent overlay used when editing
    var $overlay = $('<div/>', { class: 'overlay'});
    $content.append($overlay);
    $overlay.hide();

    // *** WB-PANE EXTENDED METHODS ***

    $.extend($new_wb_pane, {

        set_edit_mode: function(edit_mode) {
            curr_edit_mode = edit_mode;

            // Toggle button visiblility based on edit modes
            $btn_draw.toggle(   edit_mode === 'idle');
            $btn_upload.toggle( edit_mode === 'moving');
            $btn_accept.toggle( edit_mode === 'drawing')
            $btn_trash.toggle(  edit_mode === 'drawing' || edit_mode === 'moving');

            // Show transparent overlay when drawing or typing only
            $('.overlay', $new_wb_pane).toggle(edit_mode === 'drawing' || edit_mode === 'typing');
        },

        reset: function() {
            if (!(typeof $canvas === "undefined"))
                $canvas.parent().remove();
            $('.fade').remove();
            $new_wb_pane.set_edit_mode('idle')
        },

        get_svg_wrapper: function(){return svg_wrapper},

        content: $content
    });

    $new_wb_pane.reset();

    $btn_draw.click(function () {
        reset_all_panes();
        $canvas = open_canvas($content);
        $new_wb_pane.set_edit_mode('drawing');
        $(window).resize();
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
        $movable_drawing.center();

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