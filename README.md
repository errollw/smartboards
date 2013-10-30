# Smartboards

Smartboards is an interactive networked public noticeboard framework. It was developed to facilitate remote communication between members of the [Cambridge Computer Lab](http://www.cl.cam.ac.uk/)'s [Graphics and Interaction](http://www.cl.cam.ac.uk/research/rainbow/) research group.

The system was designed for large touch-screen displays located along the research group's corridor, each powered by a [Raspberry Pi](http://www.raspberrypi.org/). Members can also view and edit the boards remotely via web-apps, keeping the group updated on their status or interests.

![Image of kiosk in use](http://i.imgur.com/tJ97xoL.jpg)

It is comprised of three web-app interfaces:

1. The **kiosk** - an optimized editor designed for public terminal use with a kiosk-mode browser
2. The **editor** - a more feature-rich editor for desktop or mobile use
3. The **viewer** - a responsive smartboard browser and settings editor.

### Board content

Each office (or room) has an external smartboard, shared by that office's users. The smartboard display is split vertically into several *panes*, one for each user. Each pane consists of a profile picture and description of its user, and a large section displaying a [SVG](http://www.w3.org/Graphics/SVG/).

The SVG consists of images that can be moved around or resized. These either link externally or include the image in-line using a [data URI](https://developer.mozilla.org/en/docs/data_URIs). Users also have the option to embed a website behind the SVG which may be interactive.

## Kiosk

## Editor

## Viewer

## dependencies

* [jQuery](http://jquery.com/)
* [jQuery.qrcode.js](http://jeromeetienne.github.io/jquery-qrcode/) - allows the editor to generate QR codes in-browser
* [jQuery.ScrollTo](http://demos.flesler.com/jquery/scrollTo/) - for scrolling between views in the web-app's mobile configuration 
