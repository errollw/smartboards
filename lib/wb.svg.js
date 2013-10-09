function place_img_in_svg($m_d, img_src, svg_wrapper){

    // Find the scale to adjust image by when placing it in SVG
    zoom = get_zoom(svg_wrapper)

	// Set size and object of image in SVG coords
    var size = {
        w: $m_d.width() * zoom,
        h: $m_d.height() * zoom
    };
    var pos = {
        x: ($m_d.position().left + M_D_BORDER_WIDTH) * zoom,
        y: ($m_d.position().top + M_D_BORDER_WIDTH) * zoom
    };

    image = svg_wrapper.image(pos.x, pos.y, size.w, size.h, img_src);

    // Ensure placed image can be clicked (parent SVG can be clicked through to an underlying iframe)
    image.setAttribute('pointer-events','all');
}

// Handler attached to each img in the SVG
function svg_img_click_handler($wb_pane){

    return function() {

        reset_all_panes();

        // FIXME: why does the attr sometimes get set as href (without xlink prefix)?
        var data_URI = $(this).attr('xlink:href')
        if (data_URI === undefined)
            data_URI = $(this).attr('href');

        var svg_wrapper = $wb_pane.get_svg_wrapper(),
            z = get_zoom(svg_wrapper);

        var image_box = {
            x:      $(this).attr('x') / z,
            y:      $(this).attr('y') / z,
            width:  $(this).attr('width') / z,
            height: $(this).attr('height') / z
        }
        var parent_rect = $(this).parent()[0].getBoundingClientRect();
        $(this).remove();

        $movable_drawing = make_movable_drawing(data_URI, image_box, parent_rect, $wb_pane, svg_wrapper);
        $wb_pane.content.append($movable_drawing);

        $wb_pane.set_edit_mode('moving');
    }
}

// Upload the SVG to the server
function upload_svg(u_id, svg_wrapper){

    // Add attributes to make a valid SVG
    add_namespace_attrs(svg_wrapper._svg);

    // POST new SVG source to save it on server
    $.ajax({
        url:       'cgi-bin/ajaxpost.py',
        type:      'post',
        datatype:  'json',
        data: {    'user':     u_id,
                   'svg_data': svg_wrapper.toSVG() }
    });
}

// ----- SVG specific Utils -----

function add_namespace_attrs(svg_element){
    svg_element.setAttribute('xmlns', $.svg.svgNS);
    svg_element.setAttribute('xmlns:xlink', $.svg.xlinkNS);
}

function get_zoom(svg_wrapper){
    vb = get_viewbox(svg_wrapper._svg);
    return Math.min(
        vb.width  / svg_wrapper._svg.getAttribute('width'),
        vb.height / svg_wrapper._svg.getAttribute('height'));
}

function get_viewbox(svg_element){
    var vb_str = svg_element.getAttribute('viewBox');
    vb = vb_str.split(" ");
    return {x: vb[0], y: vb[1], width: vb[2], height: vb[3]};
}