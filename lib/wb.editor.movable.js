// Constants
var M_D_BORDER_WIDTH = 2,
    DRAG_PADDING = 16,
    IS_DIAG_PT_KEY = 'is_diag_pt';

var is_dragging = false,
    is_resizing = false;

var anchor_pt = {x:0, y:0},
    opp_ctrl_pt = {},
    grab_point = {x:0, y:0};
    anchor_x_rat = anchor_y_rat = 0;
    resize_diag = false;                // Is resizing via diagonal?

function make_movable_drawing(image_src, image_box, $wb_pane){

    var aspect_ratio = image_box.width/image_box.height;

    // Initialize movable drawing
    var img = new Image();
    img.src = image_src;
    img.draggable = false;
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
            anchor_pt.x = $counter_pt.offset().left;
            anchor_pt.y = $counter_pt.offset().top;

            anchor_x_rat = (anchor_pt.x - $m_d.offset().left)/$m_d.width(),
            anchor_y_rat = (anchor_pt.y - $m_d.offset().top)/$m_d.height();

            resize_diag = $ctrl_pt.data(IS_DIAG_PT_KEY);

            is_dragging = false;
            is_resizing = true;
        },

        stop: function(){
            console.log('stop')

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
                top:  mouseY - grab_point.y,
                left: mouseX - grab_point.x
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

            // Move m_d's origin to anchor position
            $m_d.offset({
                top:  anchor_pt.y, left: anchor_pt.x });

            // Now offset by anchor / m_d origin vector
            $m_d.offset({
                top:  anchor_pt.y + (anchor_pt.y-opp_ctrl_pt.offset().top),
                left: anchor_pt.x + (anchor_pt.x-opp_ctrl_pt.offset().left)
            });
        },

        place: function() {
            place_img_in_svg($(this), image_src, $wb_pane.get_svg_root());
            if ($m_d.moved) upload_svg($wb_pane.data('u_id'), $wb_pane.get_svg_root());
            remove_movable_handlers($wb_pane);
            $m_d.remove();
        },

        // Delete SVG from kiosk editor AND from the server
        trash: function() {
            upload_svg($wb_pane.data('u_id'), $wb_pane.get_svg_root());
            remove_movable_handlers($wb_pane);
            $m_d.remove();
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
    ['sw-resize', 's-resize', 'se-resize'], ]

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

    $m_d.on('touchstart.movable', function(e){
        e.preventDefault();
        var point = touchEventToPoint(e);
        var xe = point.x - $(e.target).offset().left, 
            ye = point.y - $(e.target).offset().top;
        $m_d.start_dragging(xe, ye);
    });

    $wb_pane.on('touchmove.movable', function(e){
        e.preventDefault();
        var point = touchEventToPoint(e);
        if (is_resizing === true)
            $m_d.resize_to(point.x, point.y);
        else if (is_dragging === true)
            $m_d.drag_to(point.x, point.y);
    });

    $m_d.on('mousedown', function(e){
        var xe=e.offsetX, ye=e.offsetY;                      // Fix for Firefox not having offsetX, offsetY
        if(!xe) xe= e.clientX - $(e.target).offset().left;
        if(!ye) ye= e.clientY - $(e.target).offset().top;
        $m_d.start_dragging(xe, ye);
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

    $(window).on('mouseup.movable touchend.movable', $m_d.stop);

}

function remove_movable_handlers($wb_pane){
    $wb_pane.off('.movable');
    $(window).off('.movable');
}