#!/usr/bin/env python

import cgi
import os

from utils import simple_success_response_JSON
from shutil import copyfile

args =     cgi.FieldStorage()
u_id =     args['u_id'].value

### Check if SVG exists for each user. If it doesn't, create one
### ------------------------------------------------------------

svg_path = os.path.join('..', 'content')	# Path to user SVG files
os.chdir(svg_path)
svg_base = 'svg_base.svg'					# Name of file with basic wb SVG properties

user_svg_file = u_id + '.svg'
copyfile(svg_base, user_svg_file)			# Copy base SVG file into the user's SVG

### Update that room's 'last-mod' field in its config file
### -------------------------------------------------------------

config_filename = r_id + '.xml'
config_path = os.path.join('..', 'config', 'room', config_filename)
tree = ET.parse(config_path)
tree.find('last-mod').text = str( int(time.time()) * 1000 )
tree.write(config_path, encoding="utf-8", xml_declaration=True)

simple_success_response_JSON();