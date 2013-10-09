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

    function resize() {
        is_mobile = ($(window).width() < BREAK_SMALL)

        // Snap to SIDES if mobile, else snap to TOP/BOTTOM
        $wb_container.css({
            width:  is_mobile ? $container.width() : $container.height() / wb_aspect_ratio,
            height: is_mobile ? $container.width() * wb_aspect_ratio : $container.height(),
        });
    };
    $(window).resize(resize);

    // Check query string for requested room_ID, else load default
    var query_r_id = getQueryVariable('r_id', DEFAULT_ROOM_ID);

    document.title = PAGE_TITLE_FMT_EDITOR.f(strip_id(query_r_id).toUpperCase());

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
        $btn_image =    $('<button/>', {class: 'blue'}).html(ICON_HTML_FMT.f('picture')),
        $btn_accept =   $('<button/>', {class: 'green'}).html(ICON_HTML_FMT.f('move')),
        $btn_upload =   $('<button/>', {class: 'green'}).html(ICON_HTML_FMT.f('save')),
        $btn_trash =    $('<button/>', {class: 'red'  }).html(ICON_HTML_FMT.f('trash'));
    $header.append($btn_accept).append($btn_upload).append($btn_trash);
    $header.append($btn_image).append($btn_draw);

    //Create content pane for displaying whiteboard SVG and drawing with pen
    var $content = $('<div/>', { class: 'wb-content'});
    $new_wb_pane.append($content);

    // Header's height grows with wb
    function resize() {

        // Adjust header and divider height
        $header.height($container.height() * header_height_ratio);
        $('.divider', $new_wb_pane).height($container.height() * divider_height_ratio);

        // Force square buttons and pics, and adjust their "depth" shadow
        $profile_pic.width($header.height());
        $header.children('button').width($header.height());
        $header.children('button').css({
            width:     $header.height(),
            boxShadow: HEADER_BTN_BOX_SHADOW_FMT.f(Math.max(2, $header.height() * HEADER_BTN_BOX_SHADOW_RATIO))
        });

        // Adjust font-sizes to fit header
        $header.children('button').css('font-size', Math.max(14, $header.height() * big_font_ratio));
        $title.css(   'font-size', $header.height() * (is_mobile ? mobile_font_ratio : big_font_ratio));
        $subtitle.css('font-size', $header.height() * (is_mobile ? mobile_font_ratio : small_font_ratio));
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

            // Allow pointer events on images within the SVG
            $('image',svg_wrapper.root()).css('pointer-events','all')
        }
    });

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
            $btn_image.toggle(  edit_mode === 'idle');
            $btn_upload.toggle( edit_mode === 'moving');
            $btn_accept.toggle( edit_mode === 'drawing')
            $btn_trash.toggle(  edit_mode === 'drawing' || edit_mode === 'moving');

            // Show transparent overlay when drawing or typing only
            $('.overlay', $new_wb_pane).toggle(edit_mode === 'drawing' || edit_mode === 'typing');
        },

        reset: function() {
            resize();
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

    $btn_image.click(function (){
        reset_all_panes();
        open_image_url_input($content, $new_wb_pane);
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