var QRCODE_PLACEHOLDER_TXT = 'Type or paste QR code text here';

function open_qr_code_text_input($wb_content_div, $wb_pane){

	// Create bounding containers and add to DOM
    var $input_row =   $('<div/>',   { class: 'input_row' }),
    	$text_box =    $('<input/>', {type: 'text', name: 'image_url', placeholder: QRCODE_PLACEHOLDER_TXT}),
    	$btn_accept =  $('<button/>').html(ICON_HTML_FMT.f('ok')),
        $btn_cancel =  $('<button/>').html(ICON_HTML_FMT.f('remove'));

    $input_row.append($text_box).append($btn_accept).append($btn_cancel)
    $wb_content_div.append($input_row);

    $wb_pane.set_edit_mode('typing');

    $btn_accept.click(function(){
    	$input_row.remove();

    	// Use a default image_box height
	    var image_box = { x: 0, y: 0, width: $wb_pane.width()/4, height: $wb_pane.width()/4 }

	    // Create and add the $movable_drawing object
	    var qr_code_uri = get_qr_code_as_data_uri($text_box.val())
	    $movable_drawing = make_movable_drawing(qr_code_uri, image_box, $wb_pane);
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

function make_qr_code_movable_drawing(text){
	var data_uri = get_qr_code_as_data_uri;
}

function get_qr_code_as_data_uri(text){
	var $temp_qr_canvas_holder = $('<div>');
	$temp_qr_canvas_holder.qrcode(text);
	var qr_canvas = $('canvas', $temp_qr_canvas_holder)[0];

	return qr_canvas.toDataURL("image/png");
}