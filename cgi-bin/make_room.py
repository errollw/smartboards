#!/usr/bin/env python

import xml.etree.ElementTree as ET
import os
import cgi
import json

from room import make_room
from utils import indent
from shutil import copyfile

print "Content-type: application/json"
print ""

### Get JSON for each room, and write out to XML room config file
### -------------------------------------------------------------

args = cgi.FieldStorage()
print args['json-data']
room = json.loads(args.getvalue('json-data'))

# Make XML tree from room JSON
root = make_room(room)
indent(root)
tree = ET.ElementTree(root)

# Write room XML out
xml_filename = room['id'] + '.xml'
path = os.path.join('..', 'config', 'room', xml_filename)
tree.write(path, encoding="utf-8", xml_declaration=True)


### Check if SVG exists for each user. If it doesn't, create one
### ------------------------------------------------------------

svg_path = os.path.join('..', 'content')	# Path to user SVG files
os.chdir(svg_path)
svg_base = 'svg_base.svg'					# Name of file with basic wb SVG properties

for u_id, vals in room['users'].iteritems():
	user_svg_file = u_id + '.svg'
	try:
   		with open(user_svg_file): pass		# If that file is open-able, pass
	except IOError:
   		copyfile(svg_base, user_svg_file)	# Otherwise, copy base SVG file