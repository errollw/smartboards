var settings_subtitle_fmt = 'Room ID : &nbsp; <span class:"mono">{0}</span> &ensp; <i class="icon-edit"></i>&nbsp; {1}',
    settings_tutorial_txt = 'Please select a room to view its settings'

var website_positions = ['top', 'left', 'right', 'fill'],
    def_web_pos = website_positions[3];

function load_settings(room){
    
    var $settings_container = $('#settings-container');
    $('.settings-list', $settings_container).show();     // show list of settings if hidden

    $settings_container.data('r_id', room.id);
    $('.subtitle', $settings_container).html(settings_subtitle_fmt.f(room.id, smartdate(room.last_mod)));

    // Clear all current users in settings pane
    $settings_container.find('.user').remove();

    // Load room settings into form fields
    $settings_container.find('input[name=r_name]').val(room.name).data('default', room.name);
    $settings_container.find('input[name=tags]').val(room.tags.join(', '));

    var $add_user_btn = $('#settings-add-user');

    // On input change, add "changed" class to settings fields
    $settings_container.on('keyup', 'input', function(){
        $(this).toggleClass('changed', $(this).data('default') !== $(this).val());

        if ($(this).attr('name') == 'u_web_url'){
            var pos_div = $(this).parent().parent().children('.u_web_pos_div');
            pos_div.toggle($(this).val() !== "");
        }
    });

    $.each(room.users, function(index, user){

        // Create container divs
        var $u_settings = make_user_settings_div();
        $add_user_btn.before($u_settings);

        // Set initial form values for each user
        $u_settings.find('input[name=u_id]').val(user.id).data('default', user.id);
        $u_settings.find('input[name=u_name]').val(user.name).data('default', user.name);
        $u_settings.find('input[name=u_status]').val(user.status).data('default', user.status);
        $u_settings.find('button.profile-pic').css('background-image', robust_prof_pic(user.id));

        if(user.website_url !== undefined){

            $u_settings.find('input[name=u_web_url]').val(user.website_url).data('default', user.website_url);
            var pos_ind = website_positions.indexOf(user.website_pos);
            $('.pos:nth-child({0})'.f(pos_ind == -1 ? 5 : pos_ind+2), $u_settings).addClass('toggled default');
            $('.u_web_pos_div', $u_settings).show();

        } else {

            $('input[name=u_web_url]', $u_settings).data('default', '');  // Default website is empty string '' for handling CHANGED styles
            $('.u_web_pos_div', $u_settings).hide();                      // No need to show position buttons for no website
        }
    });
}

function parse_tags(tag_string){
    var tags_to_return = [],
        tag_string_split = (tag_string+',').split(',');         // Add an extra comma to handle single tag entries

    for (var i in tag_string_split){
        var trimmed_tag = tag_string_split[i].trim();           // Remove any unnecessary extra spaces
        if(trimmed_tag !== '')                                  // Only store non-empty tags
            tags_to_return.push(tag_string_split[i].trim());
    }

    return tags_to_return;
}

function save_settings() {

    var $settings_container = $('#settings-container');

    // Initialise data object to be POSTed for saving new room settings
    var room_data = {
        'id'       : $settings_container.data('r_id'),
        'name'     : $settings_container.find('input[name=r_name]').val(),
        'last-mod' : Date.now(),
        'tags'     : parse_tags($settings_container.find('input[name=tags]').val()),
        'users'    : {}
    }

    // Add settings for each user to data
    $settings_container.find('.user').each(function(i){

        var u_id = $(this).find('input[name=u_id]').val();

        room_data['users'][u_id] = {
            'name'   : $(this).find('input[name=u_name]').val(),
            'status' : $(this).find('input[name=u_status]').val()
        }

        // Checks if a website is entered
        var u_web_url = $(this).find('input[name=u_web_url]').val();
        if (u_web_url !== ""){
            var web_pos = $(this).find('button.pos.toggled').first().text();
            room_data['users'][u_id]['website_url']= u_web_url;
            room_data['users'][u_id]['website_pos']= web_pos == "" ? def_web_pos : web_pos;
        }

        // Assign profile pic uid in hidden upload form
        $(this).find('input[name=pic_u_id]').val(u_id);
    });

    console.log(room_data);

    $.post(SCRIPTS_FMT.f('make_room'), {
        'json-data' : JSON.stringify(room_data)});

    // Submit all profile pic upload forms
    $settings_container.find('form[name=upload_prof_pic]').submit();

    // Finally force a hard refresh from server
    location.reload();
}

function init_settings(){

    var $settings_container = $('#settings-container'),
        $add_user_btn = $('#settings-add-user');

    $settings_container.on('click', '#settings-cancel', function(){
        $('button.show-settings').show();
        $settings_container.hide()
    });
    $settings_container.on('click', '#settings-save', save_settings);

    $add_user_btn.click(function(){ $add_user_btn.before(make_user_settings_div()); });

    // Website position click handler
    $settings_container.on('click', 'button.pos', function(){
        $(this).parent().children('.pos').removeClass('toggled changed');
        $(this).addClass('toggled');
        if (!$(this).hasClass('default')) $(this).addClass('changed');
    });

    // On clicking a user setting 'trash' button, remove UI elements
    $settings_container.on('click', 'button.trash', function(){
        $(this).parent().parent().remove();
    });

    // Hide the container and settings list to begin with
    $('.settings-list', $settings_container).hide();
    $('.subtitle', $settings_container).html(settings_tutorial_txt);
    $settings_container.hide();


}