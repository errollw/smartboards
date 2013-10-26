// System is either idle (just viewing), moving a movable drawing, drawing, or typing
var edit_modes = ['idle', 'moving', 'drawing', 'typing'];
var default_edit_mode = edit_modes[0];
var curr_edit_mode = default_edit_mode;

var is_mobile = false;

var $canvas,                          // an open drawable canvas
    $movable_drawing;                 // a movable, resizable drawing

var wb_panes = [];                    // list of all wb_panes on the screen

var r_id;                             // this room's unique room id

//Runs once page is loaded
$(function () {

    var $container =    $('body'),
        $wb_container = $('#wb_container'),
        $controls =     $('#controls');

    function resize() {
        is_mobile = ($(window).width() < BREAK_SMALL);
        $('.desktop-only').toggle(!is_mobile);
        $('.mobile-only').toggle(is_mobile);

        // Snap to SIDES if mobile, else snap to TOP/BOTTOM
        $wb_container.css({
            width:  is_mobile ? $container.width() : $container.height() / wb_aspect_ratio,
            height: is_mobile ? $container.width() * wb_aspect_ratio : $container.height(),
        });

        $controls.toggle($wb_container.offset().left > $controls.outerWidth());
        $controls.css({ left: $wb_container.offset().left/2 - $controls.outerWidth()/2 });
    };
    $(window).resize(resize); resize();

    // Check query string for requested room_ID, else load default
    r_id = getQueryVariable('r_id', DEFAULT_ROOM_ID);

    // Set page titles
    document.title = PAGE_TITLE_FMT_EDITOR.f(strip_id(r_id).toUpperCase());
    $('.page-title').text(document.title);

    // Button to load viewer
    $('button.view-all-rooms').click(function(){
        url = window.location.href;
        url = url.substring(0, url.lastIndexOf("/") + 1) + 'viewer.html';
        window.open(url);
    });

    // Get JSON for chosen room
    $.getJSON( SCRIPTS_FMT.f('get_room'), {r_id : r_id},

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
    $new_wb_pane.data('u_id', user.id);
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
        $btn_qrcode =   $('<button/>', {class: 'blue'  }).html(ICON_HTML_FMT.f('qrcode')),
        $btn_accept =   $('<button/>', {class: 'green'}).html(ICON_HTML_FMT.f('ok')),
        $btn_upload =   $('<button/>', {class: 'green'}).html(ICON_HTML_FMT.f('save')),
        $btn_trash =    $('<button/>', {class: 'red'  }).html(ICON_HTML_FMT.f('trash'));
    $header.append($btn_accept).append($btn_upload).append($btn_trash);
    $header.append($btn_image).append($btn_qrcode).append($btn_draw);

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
        $header.children('button').css({
            width:     $header.height(),
            boxShadow: HEADER_BTN_BOX_SHADOW_FMT.f(Math.max(2, $header.height() * HEADER_BTN_BOX_SHADOW_RATIO)),
            fontSize:  Math.max(14, $header.height() * big_font_ratio)
        });

        // Adjust font-sizes to fit header
        $title.css(   'font-size', $header.height() * (is_mobile ? mobile_font_ratio : big_font_ratio));
        $subtitle.css('font-size', $header.height() * (is_mobile ? mobile_font_ratio : small_font_ratio));

        $content.find('svg').attr({
            width  : $container.width(),
            height : $container.height()
        });
    }
    $(window).resize(resize);

    if(user.website_url !== undefined)
        insert_iframe($content, user.website_pos, user.website_url);

    // Load and place user-specific SVG
    var $svg_holder = $('<div/>', { class: 'svg-holder'});
    $content.append($svg_holder);
    $svg_holder.load(user_svg_url(user.id), function(){
        $('svg > image').css('pointer-events','all'); resize(); });

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
            $btn_qrcode.toggle( edit_mode === 'idle');
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

        get_svg_root: function(){return $('svg', $svg_holder)},

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

    $btn_qrcode.click(function (){
        reset_all_panes();
        open_qr_code_text_input($content, $new_wb_pane);
    });

    $btn_accept.click(function () {

        // If the canvas is empty, cancel
        if ($canvas.data('empty') === true){
            $new_wb_pane.reset();
            return;
        }

        // Add movable drawing from canvas
        $movable_drawing = $canvas.to_movable_drawing($new_wb_pane);
        $content.append($movable_drawing);
        $canvas.parent().remove();

        // Center the movable drawing after adding it
        $movable_drawing.center();

        $new_wb_pane.set_edit_mode('moving');
    });

    $btn_upload.click(function() {
        $movable_drawing.place();
        $new_wb_pane.set_edit_mode('idle');
    });

    $btn_trash.click(function() {
        if (!(typeof $movable_drawing === "undefined"))
            $movable_drawing.trash();

        $new_wb_pane.reset();
    });

    return $new_wb_pane;
}