// System is either idle (just viewing), moving a movable drawing, or drawing
var edit_modes = ['idle', 'moving', 'drawing', 'typing'];
var default_edit_mode = edit_modes[0];
var curr_edit_mode = default_edit_mode;

var is_mobile = false                 

var $canvas,                          // an open drawable canvas
    $movable_drawing;                 // a movable, resizable drawing

var wb_panes = [];                    // list of all wb_panes on the screen

var r_id;                             // this room's unique room id

var RELOAD_INTERVALS_MS = 5 * 1000,
    REFRESH_PAGE_TIMEOUT_MS = 15 * 60 * 1000;

//Runs once page is loaded
$(function () {

    var $container =      $('body'),
        $wb_container =   $('#center-col');

    // Check query string for requested room_ID, else load default
    r_id = getQueryVariable('r_id', DEFAULT_ROOM_ID);

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

    // Reload SVG every few minutes, refresh page less often
    // TODO: server push...
    window.setInterval(reload_all_svgs, RELOAD_INTERVALS_MS);
    window.setTimeout(function(){location.reload(true)}, REFRESH_PAGE_TIMEOUT_MS);
});

// Resets all wb-panes on the screen, returning them to idle mode
function reset_all_panes(){
    $.each(wb_panes, function(ind, $pane){
        $pane.reset(); });
}

// Loads all SVGs
function reload_all_svgs(){
    if (curr_edit_mode == 'idle') {
        reset_all_panes();
        $.each(wb_panes, function(ind, $pane){
            $pane.reload_svg(); });
    }
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
        $btn_accept =   $('<button/>', {class: 'green'}).html(ICON_HTML_FMT.f('ok')),
        $btn_upload =   $('<button/>', {class: 'green'}).html(ICON_HTML_FMT.f('ok')),
        $btn_trash =    $('<button/>', {class: 'red'  }).html(ICON_HTML_FMT.f('trash'));
    $header.append($btn_trash).append($btn_draw).append($('<div/>', {class:'divider'})).append($btn_accept)
        .append($btn_upload);

    //Create content pane for displaying whiteboard SVG and drawing with pen
    var $content = $('<div/>', { class: 'wb-content'});
    $new_wb_pane.append($content);

    if(user.website_url !== undefined)
        insert_iframe($content, user.website_pos, user.website_url);

    // user-specific SVG goes in svg_holder
    var $svg_holder = $('<div/>', { class: 'svg-holder'});
    $content.append($svg_holder);

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

        reload_svg: function(){
            $svg_holder.load(user_svg_url(user.id), function(){
                $('svg > image').css('pointer-events','all');
                
                // Only resize SVG once on load
                $content.find('svg').attr({ width  : $container.width(),
                                            height : $container.height() });
            });
        },

        get_svg_root: function(){return $('svg', $svg_holder)},

        content: $content
    });

    $new_wb_pane.reset();
    $new_wb_pane.reload_svg();

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
        $movable_drawing = $canvas.to_movable_drawing($new_wb_pane);
        $content.append($movable_drawing);
        $canvas.parent().remove();

        // Center the movable drawing after adding it
        var o = $content.offset();
        $movable_drawing.offset({
            left: o.left + $content.width()/2 - $movable_drawing.width()/2,
            top:  o.top + $content.height()/2 - $movable_drawing.height()/2
        });

        $new_wb_pane.set_edit_mode('moving');
    });

    $btn_upload.mouseup(function(e) {
        e.stopPropagation();            // Prevent placing when clicking $wb-pane
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