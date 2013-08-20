// Constants
var M_D_BORDER_WIDTH = 2,
    DRAG_PADDING = 16;

function make_movable_drawing(image_URI, image_box, p_rect, $wb_pane){

    var svg_wrapper = $wb_pane.get_svg_wrapper(),
        svg_elem =    svg_wrapper._svg;

    // Initialize movable drawing
    var $m_d = $('<div/>', { class: 'movable' });
    $m_d.css({
        left:            image_box.x - M_D_BORDER_WIDTH,
        top:             image_box.y - M_D_BORDER_WIDTH,
        height:          image_box.height,
        width:           image_box.width,
        backgroundImage: 'url(' + image_URI + ')'
    });
    $m_d.moved = false;

    var aspect_ratio = image_box.width/image_box.height,
        is_dragging = false,
        is_resizing = false,
        grab_point = {x:0, y:0};

    // Methods for dragging and resizing

    function start_dragging(grabX, grabY){
        grab_point = {x:grabX, y:grabY};
        is_dragging = true;
    }
    function start_resizing(){
        is_resizing = true;
    }
    function stop(e){
        if (is_dragging || is_resizing) {
            is_dragging = is_resizing = false;
        } else {
            $m_d.place();
            toggle_iframe_tarps(false);
            $wb_pane.set_edit_mode('idle')
        }
    }
    function drag_to(mouseX, mouseY){
        $m_d.moved = true;
        $m_d.offset({
            top:  Math.max(p_rect.top - $m_d.height()/2, Math.min(
                   p_rect.bottom - $m_d.height()/2, mouseY - grab_point.y)),
            left: Math.max(p_rect.left - $m_d.width()/2, Math.min(
                   p_rect.right - $m_d.width()/2, mouseX - grab_point.x))
        });
    }
    function resize_to(mouseX, mouseY){
        $m_d.moved = true;
        m_rect = $m_d[0].getBoundingClientRect();
        var resize_end_pt = {
            x: Math.max(p_rect.left, Math.min(p_rect.right, mouseX)),
            y: Math.max(p_rect.top, Math.min(p_rect.bottom, mouseY))
        };
        
        if(resize_end_pt.x - m_rect.right > resize_end_pt.y - m_rect.bottom){
            $m_d.width(resize_end_pt.x - m_rect.left);
            $m_d.height($m_d.width() / aspect_ratio);
        } else {
            $m_d.height(resize_end_pt.y - m_rect.top);
            $m_d.width($m_d.height() * aspect_ratio);
        }
    }

    // Bind methods to event handlers

    $m_d.mousedown(function(e){
        toggle_iframe_tarps(true);
        if (Math.min($m_d.width() - e.offsetX, $m_d.height() - e.offsetY) < DRAG_PADDING){
            start_resizing();
        } else {
            start_dragging(e.offsetX, e.offsetY);
        }
    });
    $(window).bind('mousemove.movable', function(e){
        if (is_resizing === true)
            resize_to(e.pageX, e.pageY);
        else if (is_dragging === true)
            drag_to(e.pageX, e.pageY);
    });
    $(window).bind('mouseup.movable',stop);

    // Extend object with functions to place it in SVG, and trash it

    $.extend($m_d, {
        place: function() {
            place_img_in_svg($(this), svg_wrapper);
            if ($m_d.moved) upload_svg($.data(svg_elem, 'u_id'), svg_wrapper)
            $(window).unbind('.movable');
            $(this).remove();
        },
        trash: function() {
            $(window).unbind('.movable');
            $(this).remove();
            upload_svg($.data(svg_elem, 'u_id'), svg_wrapper);
        }
    });

    // RETURN MOVABLE DRAWING OBJECT

    return $m_d;
}