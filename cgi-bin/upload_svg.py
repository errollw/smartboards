#!/usr/bin/env python

import xml.etree.ElementTree as ET
import json
import cgi
import os
import time

args =     cgi.FieldStorage()
svg_data = args['svg_data'].value
u_id =     args['u_id'].value
r_id =     args['r_id'].value

### Write out that user's new SVG data
### -------------------------------------------------------------

svg_path = os.path.join('..', 'content', u_id + '.svg')
f = open(svg_path,"w")
f.write(svg_data)
f.close()

### Update that room's 'last-mod' field in its config file
### -------------------------------------------------------------

config_filename = r_id + '.xml'
config_path = os.path.join('..', 'config', 'room', config_filename)
tree = ET.parse(config_path)
tree.find('last-mod').text = str( int(time.time()) * 1000 )
tree.write(config_path, encoding="utf-8", xml_declaration=True)

# Return success
result = {}
result['success'] = True

print "Content-type: application/json"
print
print json.dumps(result,indent=1)