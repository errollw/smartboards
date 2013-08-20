var NATIVE_IFRAME_HEIGHT = 1680;

var css_w = {'left' : '50%',
			 'right': '50%'}

// Inserts an iframe into the container
// Pos is either 'left', 'right', 'top' or defaults to FILL
function insert_iframe($container, pos, url){

 	var $iframe_holder = $('<div/>', { class: 'iframe-holder' }),
 		$iframe =        $('<iframe/>', {scrolling: "no", 'src': url});
	$iframe_holder.append($iframe)
	$container.append($iframe_holder)

	$iframe.css({
		float : pos in css_w ? pos : 'none',
		transformOrigin : (pos == 'right' ? '100% 0%' : '0%  0%')
	});

	// On resize, iframe holder fills its parent,
	// And iframe scales and places itself (to appear OK on small screens)
    function resize() {

    	var scale = $(window).height() / NATIVE_IFRAME_HEIGHT;

        $iframe_holder.css({
        	width :     $iframe_holder.parent().width(),
			height :    $iframe_holder.parent().height(),
        });

        $iframe.css({
        	transform : 'scale({0}, {0})'.f(scale),
			width :     $iframe_holder.width()  / scale / (pos in  css_w ? 2 : 1),
			height :    $iframe_holder.height() / scale / (pos == 'top' ? 2 : 1),
		});
    }
    $(window).resize(resize);
}

// Place 'tarpaulin' div over iframes to prevent focus problems during dragging
// see (http://www.mikepadgett.com/technology/technical/mouse-interactions-dragging-and-iframes/)
function toggle_iframe_tarps(use_tarps){

    if(use_tarps){

        $('iframe').each(function(){
            var $iframe_holder = $(this).parent(),
                $tarp =  $('<div/>', { class: 'tarp' });
            $tarp.css({
                width:  $iframe_holder.width(),
                height: $iframe_holder.height()
            });
            $iframe_holder.append($tarp);
        });

    } else $('.tarp').remove();
}