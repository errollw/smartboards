
var room_list_items = [],  // To keep track of all room elements in list
    room_tags = {};

var is_mobile = false;

var viewer_modes = ['list', 'settings', 'whiteboard'],
    default_viewer_mode = viewer_modes[0],
    curr_viewer_mode = default_viewer_mode;

var $wb_container, $panes_container, $list_container, $settings_container;

//Runs once page is loaded
$(function () {

    var $container =          $('body'),
        $list =               $('#room-list');

    $wb_container =       $('#wb-container'),
    $panes_container =    $('#panes-container'),
    $list_container =     $('#list-container'),
    $settings_container = $('#settings-container');

    function resize() {
        is_mobile = ($(window).width() < BREAK_SMALL)
        $('.desktop-only').toggle(!is_mobile);
        $('.mobile-only').toggle(is_mobile);

        $container.width(is_mobile ? $(window).width()*3 : $(window).width());

        $settings_container.toggleClass('absolute-floater', !is_mobile);

        if (is_mobile){

            $list_container.width($(window).width());
            $settings_container.width($(window).width());
            $wb_container.width($(window).width());

            $panes_container.css({
                width :     $(window).width(),
                height :    $(window).width() * wb_aspect_ratio,
            });
        } else {

            $wb_container.width('auto');
            $settings_container.width(  $container.width() / 3);

            $panes_container.css({
                width :     $(window).height() / wb_aspect_ratio,
                height :    $(window).height(),
            });
        }
    }
    $(window).resize(resize);
    resize();

    populate_room_list($list);

    // Initialize room settings panel with handlers and default text
    init_settings();

    set_viewer_mode(default_viewer_mode, true);

    $('body').on('click', 'button.show-list', function(){
        set_viewer_mode('list'); });

    $('body').on('click', 'button.show-settings', function(){
        set_viewer_mode('settings'); });

    $('body').on('click', 'button.open-editor', function(){
        var url = window.location.href;
        url = url.substring(0, url.lastIndexOf("/") + 1) + 'editor.html?r_id=' + $(this).data('r_id');
        window.open(url,'_blank');
    });

    // On typing in TAGS field, filter list
    $list_container.on('keyup', '#tags-field', function(){
        filter_room_list($(this).val());
    });
});

function set_viewer_mode(viewer_mode, no_scroll){
    curr_viewer_mode = viewer_mode;

    $settings_container.toggle( is_mobile || viewer_mode === 'settings')

    // In mobile mode, scroll to appropriate container
    $wb_container.scrollTo(0);
    if (is_mobile){
        var duration = (arguments.length == 2) ? 0 : 300;
        var scroll_target = { 'list' :       $list_container,
                              'whiteboard' : $wb_container,
                              'settings' :   $settings_container };

        $('body').scrollTo(scroll_target[viewer_mode], {duration:duration})
    }
}

function clear_wb(){
    $panes_container.empty();
}

function filter_room_list(partial_tag){

    partial_tag = partial_tag.toLowerCase().trim()

    $(room_list_items).each(function(){

        var r_id = $(this).data('r_id'),
            tags = room_tags[r_id],
            keep_room = false;

        for (var i in tags) {
            var tag = tags[i].toLowerCase().trim();
            if (tag.indexOf(partial_tag) != -1) keep_room = true;
        }
        $(this).toggle(keep_room)
    });
}

function populate_room_list($list) {

    // Get JSON list of all rooms and add each one to the list
    $.getJSON(SCRIPTS_FMT.f('get_all_rooms'), function(data) {
        $.each(data, function(index, room) {
            add_room_to_list($list, room)
        });
    });
}


// List item string formats
var title_fmt =    '<b>{0}</b> &ndash; {1}',
    subtitle_fmt = '<i class="icon-edit"></i> {0} &ensp; <i class="icon-tags"></i> {1}',
    tag_fmt =      '<span class="tag">{0}</span>';

function add_room_to_list($list, room){

    var $new_list_item = $('<li/>', { class: 'room-item' }).data('r_id', room.id),
        $li_details =    $('<div/>', { class: 'details' }),
        $li_controls =   $('<div/>', { class: 'controls' });
    $new_list_item.append($li_details).append($li_controls);
    $list.append($new_list_item);
    room_list_items.push($new_list_item);

    // Create two rows of text in list
    var $description = $('<div/>', { class: 'description flex-col' }),
        $title =       $('<p/>', { class: 'title' }),
        $subtitle =    $('<p/>', { class: 'subtitle' });
    $description.append($title).append($subtitle);
    $li_details.append($description);

    // Add u_ids to tags and correctly format them
    var tags_ext = room.tags.concat(room.users.map(function(u){return strip_id(u.id);}));
    var tags_display = tags_ext.map(function(t){return tag_fmt.f(t);});

    room_tags[room.id] = tags_ext;

    // Set user-specific text
    $title.html(title_fmt.f(room.name, room.users.map(function(e){return e.name;}).join(', ')));
    var last_mod_str = smartdate(room.last_mod);
    $subtitle.html(subtitle_fmt.f(last_mod_str, tags_display.join(' ')));

    // Add small and large profile pic of each user
    $.each(room.users, function(index, user){

        var $profile_pic = $('<div/>', { class: 'profile-pic' });
        $profile_pic.css('background-image', robust_prof_pic(user.id));
        $li_details.append($profile_pic);
        $profile_pic.width($li_details.height());
    });

    // Create and hide control buttons
    var $edit_btn =     $('<button/>', {class: 'open-editor'}).html('OPEN IN EDITOR'),
        $settings_btn = $('<button/>', {class: 'show-settings'}).html('SHOW SETTINGS');
    $li_controls.append($edit_btn).append($settings_btn);
    $li_controls.hide();
    $edit_btn.data('r_id', room.id);

    $li_details.click(function(){

        $('li > .controls').hide();
        $li_controls.show();
        $list.children('li').removeClass('toggled');
        $new_list_item.addClass('toggled');

        load_whiteboard(room);
        load_settings(room);
        
        set_viewer_mode('whiteboard');

        $(window).resize();
    });
}

function load_whiteboard(room){

    // Remove previous panes and add new one for each user
    clear_wb();
    $.each(room.users, function(index, user){
        user.r_id = room.id;
        add_wb_pane(user);
    });

    // Set room title for mobile browsers
    $('.title-row>p', $wb_container).text(room.name);
}

// ----- WHITEBOARD PANES -----

var HEADER_BTN_BOX_SHADOW_RATIO = 0.04,
    HEADER_BTN_BOX_SHADOW_FMT = 'inset 0 -{0}px rgba(0,0,0,0.2)';

function add_wb_pane(user) {

    //Create new whiteboard pane
    var $container = $panes_container,
        $new_wb_pane =  $('<div/>', { class: 'wb-pane flex-col' });
    $new_wb_pane.data('u_id', user.id);
    $container.append($new_wb_pane);

    //Create header flex-row and description elements
    var $header =       $('<div/>', {class: 'wb-header' }),
        $description =  $('<div/>', {class: 'description' }),
        $profile_pic =  $('<div/>', {class: 'profile-pic' }).css('background-image', robust_prof_pic(user.id)),
        $title =        $('<p/>',   {class: 'title' }).text(user.name),
        $subtitle =     $('<p/>',   {class: 'subtitle' }).text(user.status);
    $description.append($title).append($subtitle);
    $header.append($profile_pic).append($description);
    $new_wb_pane.append($header).append($('<div/>', {class:'divider'}));;

    //Create content pane for displaying user's SVG
    var $content = $('<div/>', { class: 'wb-content' });
    $new_wb_pane.append($content);

    // Header's height grows with wb, but has minimum size
    function resize() {
        
        $header.height($container.height() * header_height_ratio);
        $profile_pic.width($header.height());
        $('.divider', $new_wb_pane).height($container.height() * divider_height_ratio);

        $header.children('button').css({
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
    $svg_holder.load(user_svg_url(user.id), resize);
}