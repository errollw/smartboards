var IMG_PLACEHOLDER_TXT = 'Drag image or paste image URL here',
	IMG_PLACEHOLDER_TXT_MOB = 'Paste image URL here';

function open_image_url_input($wb_content_div, $wb_pane) {

	// Create bounding containers and add to DOM
    var $input_row =   $('<div/>',   { class: 'input_row' }),
    	$text_box =    $('<input/>', {type: 'text', name: 'image_url', placeholder: is_mobile ? IMG_PLACEHOLDER_TXT_MOB : IMG_PLACEHOLDER_TXT}),
    	$btn_accept =  $('<button/>').html(ICON_HTML_FMT.f('ok')),
        $btn_cancel =  $('<button/>').html(ICON_HTML_FMT.f('remove'));

    $input_row.append($text_box).append($btn_accept).append($btn_cancel)
    $wb_content_div.append($input_row);

    $wb_pane.set_edit_mode('typing');

    $btn_accept.click(function(){
    	$input_row.remove();

    	// Do not give image_box width and height, so it is calculated from loaded image
        var image_box = { x: 0, y: 0, width: 0, height: 0 }

        // Create and add the $movable_drawing object
        $movable_drawing = make_movable_drawing($text_box.val(), image_box, $wb_pane);
        $wb_pane.content.append($movable_drawing);
        $wb_pane.set_edit_mode('moving');

        // Will upload even if not moved after placing
		$movable_drawing.moved = true;
    });

    $btn_cancel.click(function(){
        $input_row.remove();
        $wb_pane.set_edit_mode('idle');
    });
}

