
var wb_aspect_ratio =     16 / 10,
    header_height_ratio = 0.05,      // Ratio of header size to wb size
    min_header_size =     32;        // Minimum header height in px

//Runs once page is loaded
$(function () {

    var $container =          $(' body'),
        $wb_container =       $('#wb-container'),
        $list_container =     $('#list-container'),
        $list =               $('#room-list'),
        $settings_container = $('#settings-container');

    function resize() {
        $wb_container.css({
            width :     $container.height() / wb_aspect_ratio,
            height :    $container.height(),
        });

        var asp_rat_closeness = ($(window).height() / $(window).width()) / wb_aspect_ratio;
        $list_container.css('display', (asp_rat_closeness > 0.6) ? 'none' : 'block');
    }
    $(window).resize(resize);
    resize();

    populate_room_list($list, $wb_container);

    init_settings();

    // TODO: REFACTOR ELSEWHERE
    $list_container.on('click', 'button.settings', function(){
        $settings_container.toggle(); });
});

function clear_wb($wb_container){
    $wb_container.empty();
}

function populate_room_list($list, $wb) {

    // Get JSON list of all rooms and add each one to the list
    $.getJSON(SCRIPTS_FMT.f('get_all_rooms'), function(data) {
        $.each(data, function(index, room) {
            add_room_to_list($list, $wb, room)
        });
    });
}

// List item string formats
var title_fmt =    '<b>{0}</b> &ndash; {1}',
    subtitle_fmt = '<i class="icon-edit"></i> {0} &ensp; <i class="icon-tags"></i> {1}',
    tag_fmt =      '<span class="tag">{0}</span>';

function add_room_to_list($list, $wb, room){

    var $new_list_item = $('<li/>', { class: 'room-item' });
    $list.append($new_list_item);

    // Create two rows of text in list
    var $description = $('<div/>', { class: 'description flex-col' }),
        $title =       $('<p/>', { class: 'title' }),
        $subtitle =    $('<p/>', { class: 'subtitle' });
    $description.append($title).append($subtitle);
    $new_list_item.append($description);

    // Add u_ids to tags and correctly format them
    var tags_ext = room.tags.concat(room.users.map(function(u){return strip_id(u.id);}));
    var tags_display = tags_ext.map(function(t){return tag_fmt.f(t);});

    // Set user-specific text
    $title.html(title_fmt.f(room.name, room.users.map(function(e){return e.name;}).join(', ')));
    var last_mod_str = smartdate(room.last_mod);
    $subtitle.html(subtitle_fmt.f(last_mod_str, tags_display.join(' ')));

    // Add profile pic of each user
    $.each(room.users, function(index, user){
        var $profile_pic = $('<div/>', { class: 'profile-pic' });
        $profile_pic.css('background-image', robust_prof_pic(user.id));
        $new_list_item.append($profile_pic);
        $profile_pic.width($new_list_item.height());    // Make profile-pic square
    });

    // On click, clear current whiteboard and add pane for each user
    $new_list_item.click(function(){

        $list.children('li').removeClass('toggled');
        $new_list_item.addClass('toggled');
        clear_wb($wb);

        load_settings(room);

        $.each(room.users, function(index, user){
            add_wb_pane($wb, user)
        });
        $(window).resize();
    });
}

// ----- WHITEBOARD PANES -----

function add_wb_pane($container, user) {

    //Create new whiteboard pane
    var $new_wb_pane =  $('<div/>', { class: 'wb-pane flex-col' });
    $container.append($new_wb_pane);

    //Create header flex-row and description elements
    var $header =      $('<div/>', {class: 'wb-header flex-row' }),
        $description = $('<div/>', {class: 'description flex-col' }),
        $profile_pic = $('<div/>', {class: 'profile-pic' }).css('background-image', robust_prof_pic(user.id)),
        $title =       $('<p/>',   {class: 'title' }).text(user.name),
        $subtitle =    $('<p/>',   {class: 'subtitle' }).text(user.status);
    $description.append($title).append($subtitle);
    $header.append($profile_pic).append($description);
    $new_wb_pane.append($header);

    //Create content pane for displaying user's SVG
    var $content = $('<div/>', { class: 'wb-content' });
    $new_wb_pane.append($content);

    // Header's height grows with wb, but has minimum size
    function resize() {
        
        $header.height(Math.max(min_header_size, $container.height() * header_height_ratio));
        $profile_pic.width($header.height());
        $title.css(   'font-size', $header.height() * 0.4);
        $subtitle.css('font-size', $header.height() * 0.3);

        $content.find('svg').attr({
            width  : $container.width(),
            height : $container.height()
        });
    }
    $(window).resize(resize);

    if(user.website_url !== undefined)
        insert_iframe($content, user.website_pos, user.website_url);

    var $svg_holder = $('<div/>', { class: 'svg-holder'});
    $content.append($svg_holder);
    $svg_holder.svg({ loadURL: SVG_FMT.f(user.id), onLoad: resize});

    // $content.css({ 'background-image': SVG_BG_FMT.f(user.id)});
}