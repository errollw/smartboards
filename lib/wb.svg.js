var SVG_XLINK = 'http://www.w3.org/1999/xlink',
    SVG_XMLNS = 'http://www.w3.org/2000/svg';

function place_img_in_svg($m_d, img_src, svg_root){

    // Find the scale to adjust image by when placing it in SVG
    zoom = get_zoom(svg_root)

	// Set size and object of image in SVG coords
    var size = {
        w: $m_d.width() * zoom,
        h: $m_d.height() * zoom
    };
    var pos = {
        x: ($m_d.position().left + M_D_BORDER_WIDTH) * zoom,
        y: ($m_d.position().top + M_D_BORDER_WIDTH) * zoom
    };

    // Carefully handcraft SVG image element (who needs libraries?)
    var svg_image = make_svg_image(pos.x, pos.y, size.w, size.h, img_src)
    svg_root.append(svg_image);
}

// Handler attached to each img in the SVG
function svg_img_click_handler($wb_pane){

    return function() {

        reset_all_panes();

        // FIXME: why does the attr sometimes get set as href (without xlink prefix)?
        var img_src = $(this).attr('xlink:href')
        if (img_src === undefined) img_src = $(this).attr('href');

        var svg_root = $wb_pane.get_svg_root(),
            z = get_zoom(svg_root);

        var image_box = {
            x:      $(this).attr('x') / z,
            y:      $(this).attr('y') / z,
            width:  $(this).attr('width') / z,
            height: $(this).attr('height') / z
        }
        
        $(this).remove(); // remove image to put it into a movable_drawing

        $movable_drawing = make_movable_drawing(img_src, image_box, $wb_pane);
        $wb_pane.content.append($movable_drawing);

        $wb_pane.set_edit_mode('moving');
    }
}

// Upload the SVG to the server
function upload_svg(u_id, svg_root){

    // Add attributes to make a valid SVG
    add_namespace_attrs(svg_root);

    // Awkward hack to get round JQuery/SVG incompatibility
    var svg_clone_shim = svg_root.clone();
    svg_clone_shim = $('<div />').append(svg_clone_shim);
    var svg_output = svg_clone_shim.html();

    // POST new SVG source to save it on server
    $.ajax({
        url:       'cgi-bin/upload_svg.py',
        type:      'post',
        datatype:  'json',
        data: {    'r_id':     r_id,            // r_id needed to update last-mod
                   'u_id':     u_id,            // u_id used to index SVGs
                   'svg_data': svg_output }
    });
}

// ----- SVG specific Utils -----

function add_namespace_attrs(svg_root){
    svg_root.attr('xmlns', SVG_XMLNS);
    svg_root.attr('xmlns:xlink', SVG_XLINK);
}

function get_zoom(svg_root){
    vb = svg_root[0].getAttribute('viewBox').split(" ");
    vb_obj = {x: vb[0], y: vb[1], width: vb[2], height: vb[3]};

    return Math.min(
        vb_obj.width  / svg_root.attr('width'),
        vb_obj.height / svg_root.attr('height'));
}

// Carefully handcraft SVG image element (who needs libraries?)
function make_svg_image(x, y, width, height, img_src){

    var svg_image = document.createElementNS(SVG_XMLNS,'image');
    svg_image.setAttribute('x', x); 
    svg_image.setAttribute('y', y);
    svg_image.setAttribute('width', width);
    svg_image.setAttribute('height', height);
    svg_image.setAttributeNS(SVG_XLINK, 'href', img_src);
    svg_image.setAttribute('pointer-events','all');
    svg_image.setAttribute('style',"pointer-events: all;");

    return svg_image;
}