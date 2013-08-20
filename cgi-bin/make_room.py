#!/usr/bin/env python

import xml.etree.ElementTree as ET
import os
import cgi
import json

from room import make_room
from utils import indent

print "Content-type: application/json"
print ""

args = cgi.FieldStorage()
print args['json-data']
room = json.loads(args.getvalue('json-data'))

root = make_room(room)
indent(root)
tree = ET.ElementTree(root)

filename = room['id'] + '.xml'
path = os.path.join('..', 'config', 'room', filename)
tree.write(path, encoding="utf-8", xml_declaration=True)