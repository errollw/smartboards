
var wb_aspect_ratio =     16 / 10,
    header_height_ratio = 0.045,
    big_font_ratio = 0.4,
    small_font_ratio = 0.3;

var room_list_items = [],  // To keep track of all room elements in list
    room_tags = {};



//Runs once page is loaded
$(function () {

    var $container =          $('body'),
        $wb_container =       $('#wb-container'),
        $list_container =     $('#list-container'),
        $list =               $('#room-list'),
        $settings_container = $('#settings-container');

    function resize() {
        $wb_container.css({
            width :     $container.height() / wb_aspect_ratio,
            height :    $container.height(),
        });

        // var asp_rat_closeness = ($(window).height() / $(window).width()) / wb_aspect_ratio;
        // $wb_container.toggle(asp_rat_closeness < 0.6);
    }
    $(window).resize(resize);
    resize();

    var asp_rat_closeness = ($(window).height() / $(window).width()) / wb_aspect_ratio;
    $wb_container.toggle(asp_rat_closeness < 0.6);

    populate_room_list($list, $wb_container);

    // Initialize room settings panel with handlers and default text
    init_settings();

    // Enable show settings button
    $list_container.on('click', 'button.show-settings', function(){
        $('button.show-settings').hide();   // Hide all "Show Settings" buttons
        $settings_container.show();
    });

    // On typing in TAGS field, filter list
    $list_container.on('keyup', '#tags-field', function(){
        filter_room_list($(this).val());
    });
});

function clear_wb($wb_container){
    $wb_container.empty();
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

    var $new_list_item = $('<li/>', { class: 'room-item' }).data('r_id', room.id);
    $list.append($new_list_item);
    room_list_items.push($new_list_item);

    // Create two rows of text in list
    var $description = $('<div/>', { class: 'description flex-col' }),
        $title =       $('<p/>', { class: 'title' }),
        $subtitle =    $('<p/>', { class: 'subtitle' }),
        $prof_pic_mini_holder = $('<div/>', { class: 'profile-pic-mini-holder' });
    $description.append($title).append($subtitle);
    $new_list_item.append($description);
    $new_list_item.append($prof_pic_mini_holder);

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
        $new_list_item.append($profile_pic);
        $profile_pic.width($new_list_item.height());    // Make profile-pic square

        var $profile_pic_mini = $('<div/>', { class: 'profile-pic-mini' });
        $profile_pic_mini.width($profile_pic.width()/2);
        $profile_pic_mini.height($profile_pic.height()/2);
    });

    $new_list_item.click(function(){

        $list.children('li').removeClass('toggled');
        $new_list_item.addClass('toggled');

        load_settings(room);
        load_whiteboard($wb, room);
        
        $(window).resize();
    });
}

function load_whiteboard($wb, room){

    // Remove previous panes and add new one for each user
    clear_wb($wb);
    $.each(room.users, function(index, user){
        user.r_id = room.id;
        add_wb_pane($wb, user);
    });

    if (! $('#wb-container').is(':visible')){
        $('#wb-container').show();
    }
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
        $subtitle =    $('<p/>',   {class: 'subtitle' }).text(user.status),
        $edit_btn =    $('<button/>', {class: 'blue'}).html(ICON_HTML_FMT.f('edit'));
    $description.append($title).append($subtitle);
    $header.append($profile_pic).append($description).append($edit_btn);
    $new_wb_pane.append($header);

    // On clicking the edit button, link to the editor
    $edit_btn.click(function(){
        url = window.location.href;
        url = url.substring(0, url.lastIndexOf("/") + 1) + 'editor.html?r_id=' + user.r_id;
        window.open(url,'_blank');
    });

    //Create content pane for displaying user's SVG
    var $content = $('<div/>', { class: 'wb-content' });
    $new_wb_pane.append($content);

    // Header's height grows with wb, but has minimum size
    function resize() {
        
        $header.height($container.height() * header_height_ratio);
        $profile_pic.width($header.height());
        $title.css(   'font-size', $header.height() * big_font_ratio);
        $subtitle.css('font-size', $header.height() * small_font_ratio);

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
}