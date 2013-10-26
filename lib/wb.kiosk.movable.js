// Constants
var M_D_BORDER_WIDTH = 2,
    IS_DIAG_PT_KEY = 'is_diag_pt';

var is_dragging = false,
    is_resizing = false;

var anchor_pt = {x:0, y:0},
    opp_ctrl_pt = {},
    grab_point = {x:0, y:0};
    anchor_x_rat = anchor_y_rat = 0;
    resize_diag = false;                // Is resizing via diagonal?

var autoplace_timeout,
    AUTOPLACE_TIMOUT_MS = 10000; // Used to reset an auto-place timout

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

    // initialize image box size
    img.width = image_box.width; img.height = image_box.height; 
    $m_d.append(img);

    $m_d.moved = false; // Flag for whether the image has been moved or not

    $.extend($m_d, {

        start_dragging: function(grabX, grabY){
            toggle_iframe_tarps(true);

            grab_point = {x:grabX, y:grabY};
            is_dragging = true;
            is_resizing = false;
        },

        start_resizing: function($ctrl_pt, $counter_pt){
            toggle_iframe_tarps(true);
            $('img', $m_d).remove();

            opp_ctrl_pt = $counter_pt;
            opp_pt_pos = $counter_pt.offset();
            anchor_pt.x = opp_pt_pos.left;
            anchor_pt.y = opp_pt_pos.top;

            anchor_x_rat = (anchor_pt.x - $m_d.offset().left)/$m_d.width(),
            anchor_y_rat = (anchor_pt.y - $m_d.offset().top)/$m_d.height();

            resize_diag = $ctrl_pt.data(IS_DIAG_PT_KEY);

            is_dragging = false;
            is_resizing = true;
        },

        stop: function(){
            if (is_dragging){
                is_dragging = false;
                set_autoplace_timeout($m_d);
            } else if (is_resizing) {
                is_resizing = false;
                $m_d.append(img);
                img.width = $m_d.width(); img.height = $m_d.height();   // correct img following a resize
                set_autoplace_timeout($m_d);
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
            place_img_in_svg($m_d, image_src, $wb_pane.get_svg_root());
            if ($m_d.moved) upload_svg($wb_pane.data('u_id'), $wb_pane.get_svg_root());
            remove_movable_handlers($wb_pane);
            $m_d.remove();
        },

        trash: function() {
            remove_movable_handlers($wb_pane);
            $(this).remove();
            upload_svg($wb_pane.data('u_id'), $wb_pane.get_svg_root());
        },

        center: function() {
            $m_d.css({ top:  ($m_d.parent().height() - $m_d.height()) / 2,
                       left: ($m_d.parent().width()  - $m_d.width()) / 2    });
        }

    });

    add_control_points($m_d);
    init_movable_handlers($m_d, $wb_pane);

    return $m_d;
}

function set_autoplace_timeout($m_d){
    window.clearTimeout(autoplace_timeout);
    autoplace_timeout = window.setTimeout($m_d.place, AUTOPLACE_TIMOUT_MS);
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

    $(window).on('mouseup.movable', $m_d.stop);

}

function remove_movable_handlers($wb_pane){
    $wb_pane.off('.movable');
    $(window).off('.movable');
}