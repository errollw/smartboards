// Constants
var M_D_BORDER_WIDTH = 2,
    CTRL_PT_WIDTH = 2,
    DRAG_PADDING = 16,
    IS_DIAG_PT_KEY = 'is_diag_pt';

var is_dragging = false,
    is_resizing = false;   

var anchor_pt = {x:0, y:0},
    opp_ctrl_pt = {},
    grab_point = {x:0, y:0};
    anchor_x_rat = anchor_y_rat = 0;
    resize_diag = false;                // Is resizing via diagonal?

function make_movable_drawing(image_src, image_box, p_rect, $wb_pane){

    var svg_wrapper = $wb_pane.get_svg_wrapper(),
        svg_elem =    svg_wrapper._svg;

    var aspect_ratio = image_box.width/image_box.height;

    // Initialize movable drawing
    var img = new Image();
    img.src = image_src;
    var $m_d = $('<div/>', { class: 'movable' });
    $m_d.css({
        left:            image_box.x - M_D_BORDER_WIDTH,
        top:             image_box.y - M_D_BORDER_WIDTH,
        height:          image_box.height,
        width:           image_box.width,
    });

    // If size is not given, assign size and aspect ratio on image load
    if (image_box.height == 0 || image_box.width == 0){
        img.onload = function() {
            aspect_ratio = img.width / img.height;

            // If image is bigger than pane, shrink it
            if(img.width > $wb_pane.width()){
                $m_d.width($wb_pane.width() * 0.95);
                $m_d.height($wb_pane.width()  / aspect_ratio);
            } else {
                $m_d.width(img.width);
                $m_d.height(img.height);
            }

            // Only center and append image after finding out dimensions
            $m_d.append(img);
            $movable_drawing.center();
        };
    } else {
        // Otherwise append image (with URI source) immediately
        $m_d.append(img);
    }

    // Flag for whether the image has been moved or not
    $m_d.moved = false;

    $.extend($m_d, {

        start_dragging: function(grabX, grabY){
            toggle_iframe_tarps(true);

            grab_point = {x:grabX, y:grabY};
            is_dragging = true;
            is_resizing = false;
        },

        start_resizing: function($ctrl_pt, $counter_pt){
            toggle_iframe_tarps(true);

            opp_ctrl_pt = $counter_pt;
            opp_pt_pos = $counter_pt.offset();
            anchor_pt.x = opp_pt_pos.left+CTRL_PT_WIDTH;
            anchor_pt.y = opp_pt_pos.top+CTRL_PT_WIDTH;

            anchor_x_rat = (anchor_pt.x - $m_d.offset().left)/$m_d.width(),
            anchor_y_rat = (anchor_pt.y - $m_d.offset().top)/$m_d.height();

            resize_diag = $ctrl_pt.data(IS_DIAG_PT_KEY);

            is_dragging = false;
            is_resizing = true;
        },

        stop: function(){
            if (is_dragging || is_resizing) {
                is_dragging = is_resizing = false;
            } else {
                $m_d.place();
                toggle_iframe_tarps(false);
                $wb_pane.set_edit_mode('idle')
            }
        },

        drag_to: function(mouseX, mouseY){
            $m_d.moved = true;
            $m_d.offset({
                top:  Math.max(p_rect.top - $m_d.height()/2, Math.min(
                       p_rect.bottom - $m_d.height()/2, mouseY - grab_point.y)),
                left: Math.max(p_rect.left - $m_d.width()/2, Math.min(
                       p_rect.right - $m_d.width()/2, mouseX - grab_point.x))
            });
        },

        resize_to: function(mouseX, mouseY){

            $m_d.moved = true;

            var w_scale = Math.abs(mouseX-anchor_pt.x)/$m_d.width(),
                h_scale = Math.abs(mouseY-anchor_pt.y)/$m_d.height();

            // Adjust resizing behaviour based on diagonal vs. axis aligned resize
            var scale = resize_diag ? Math.min(w_scale, h_scale) : Math.max(w_scale, h_scale);

            $m_d.width(  Math.round($m_d.width()*scale));
            $m_d.height( Math.round($m_d.width() / aspect_ratio));

            // Shift drawing back into poisition to coincide with anchor pt
            $m_d.offset({
                top:  anchor_pt.y,// - anchor_y_rat*$m_d.height(),
                left: anchor_pt.x// + (anchor_pt.x-opp_ctrl_pt.offset().left)// - anchor_x_rat*$m_d.width()
            });
            $m_d.offset({
                top:  anchor_pt.y + (anchor_pt.y-opp_ctrl_pt.offset().top),
                left: anchor_pt.x + (anchor_pt.x-opp_ctrl_pt.offset().left)
            });
        },

        place: function() {
            place_img_in_svg($(this), image_src, svg_wrapper);
            if ($m_d.moved) upload_svg($.data(svg_elem, 'u_id'), svg_wrapper);
            remove_movable_handlers($wb_pane);
            $(this).remove();
        },

        trash: function() {
            remove_movable_handlers($wb_pane);
            $(this).remove();
            upload_svg($.data(svg_elem, 'u_id'), svg_wrapper);
        },

        center: function() {
            $m_d.css({ top:  ($m_d.parent().height() - $m_d.height()) / 2,
                       left: ($m_d.parent().width()  - $m_d.width()) / 2    });
        }

    });

    add_control_points($m_d);
    init_movable_handlers($m_d, $wb_pane);

    // RETURN MOVABLE DRAWING OBJECT

    return $m_d;
}

var CURSOR_CSS = [
    ['nw-resize', 'n-resize', 'ne-resize'],
    ['w-resize',  '',         'e-resize' ],
    ['sw-resize', 's-resize', 'se-resize'],
]

// Adds 9 control points around the edges of the image, similar to Adobe Illustrator etc.
function add_control_points($m_d){

    var ctrl_pts = [[],[],[]];

    // Create control point divs
    for(var i=0; i<3; i++){
        for(var j=0; j<3; j++){

            if (i == 1 && j == 1) continue; // No center control point

            var $ctrl_pt = $('<div/>', {class: 'control-point'});
            $ctrl_pt.css({
                top:     i == 0 ? 0 : i == 1 ? '50%' : 'N/A',
                bottom:  i == 2 ? 0 : 'N/A',
                left:    j == 0 ? 0 : j == 1 ? '50%' : 'N/A',
                right:   j == 2 ? 0 : 'N/A',
                cursor:  CURSOR_CSS[i][j]
            });
            $ctrl_pt.data(IS_DIAG_PT_KEY, (i+j) % 2 == 0);
            $m_d.append($ctrl_pt);
            ctrl_pts[i][j] = $ctrl_pt;
        }
    }

    // Link control points
    for(var i=0; i<3; i++){
        for(var j=0; j<3; j++){

            if (i == 1 && j == 1) continue; // Do not handle center control point

            var opp_pt = ctrl_pts[i == 1 ? 1 : (i+2)%4][j == 1 ? 1 : (j+2)%4];
            ctrl_pts[i][j][0].counter_pt = opp_pt;
        }
    }
}

function init_movable_handlers($m_d, $wb_pane){

    $m_d.on('mousedown', function(e){
        $m_d.start_dragging(e.offsetX, e.offsetY);
    });

    $wb_pane.on('mousedown.movable','.control-point', function(){
        $m_d.start_resizing($(this), $(this)[0].counter_pt);
        return false;
    });

    $wb_pane.on('mousemove.movable', function(e){

        if (is_resizing === true)
            $m_d.resize_to(e.pageX, e.pageY);
        else if (is_dragging === true)
            $m_d.drag_to(e.pageX, e.pageY);
    });

    $(window).on('mouseup.movable', function(e){
        $m_d.stop();
    });

}

function remove_movable_handlers($wb_pane){
    $wb_pane.off('.movable');
    $(window).off('.movable');
}