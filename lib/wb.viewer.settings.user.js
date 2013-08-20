function make_user_settings_div(){	

	// Create container divs
    var $u_settings = $('<div/>', { class: 'user flex-col' }),
        $u_id =       $('<div/>', { class: 'setting' }),
        $u_name =     $('<div/>', { class: 'setting' }),
        $u_status =   $('<div/>', { class: 'setting' }),
        $u_web_url =  $('<div/>', { class: 'setting' }),
        $u_web_pos =  $('<div/>', { class: 'setting u_web_pos_div' });

    // Create user controls
    var $prof_pic_btn =  $('<button/>', { class: 'profile-pic' }).html('<i class="icon-picture"></i>'),
        $trash_btn =     $('<button/>', { class: 'red trash' }).html('<i class="icon-trash"></i>'),
        $hidden_upload = $('<form/>', {
            name:    'upload_prof_pic',
            enctype: 'multipart/form-data',
            action:  SCRIPTS_FMT.f('upload_prof_pic'),
            target:  'target_iframe',
            method:  'post'
        }),
        $hidden_file_input = $('<input/>', { type: 'file', name: 'file'}),
        $hidden_uid_input  = $('<input/>', { type: 'text', name: 'pic_u_id'});


    $u_id.append('<p>User ID</p><input type="text" name="u_id" class="mono" placeholder="unique identifier">')
            .append($prof_pic_btn).append($trash_btn);
    $u_name.append('<p> User Name </p> <input type="text" name="u_name" placeholder="user\'s full name">');
    $u_status.append('<p> Description </p> <input type="text" name="u_status" placeholder="brief description">');
    $u_web_url.append('<p> Website </p> <input type="text" name="u_web_url" placeholder="personal website">');

    $u_web_pos.append('<p></p>');
    for (var pos in website_positions){
        $u_web_pos.append('<button class="pos">{0}</button>'.f(website_positions[pos]));
    }

    // On selecting a new profile pic local file, load it into the profile pic button
    $hidden_upload.append($hidden_file_input).append($hidden_uid_input);
    $hidden_file_input.change(function(){
         if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $prof_pic_btn.css('background-image', robust_prof_pic_url(e.target.result));
            }
            reader.readAsDataURL(this.files[0]);
        }
    });

    // On pressing the profile pic preview, call CLICK() on the hidden form input
    $prof_pic_btn.click(function(){$hidden_file_input.click()});

    // Add all settings items before the 'add user' button (div)
    $u_settings.append($u_id).append($u_name).append($u_status).append($u_web_url)
    $u_settings.append($u_web_pos).append($u_web_pos);
    $u_settings.append($hidden_upload);

    $hidden_upload.hide();  // Actual upload button is hidden, controlled with other buttons
    $u_web_pos.hide();      // Hide website buttons by default

    return $u_settings;
}
