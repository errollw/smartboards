function init_controls(){

    var $wb_container = $('#wb_container'),
	    $controls =     $('#controls');

    function resize() {
        is_mobile = ($(window).width() < BREAK_SMALL)

        // Snap to SIDES if mobile, else snap to TOP/BOTTOM
        $wb_container.css({
            width:  is_mobile ? $container.width() : $container.height() / wb_aspect_ratio,
            height: is_mobile ? $container.width() * wb_aspect_ratio : $container.height(),
        });
    };
    $(window).resize(resize);
}