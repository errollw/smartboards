#!/usr/bin/env python

import json
import os
import cgi

from room import parse_room

print "Content-type: application/json"
print ""

args = cgi.FieldStorage()
r_id = args['r_id'].value

# Return JSON object of requested room
path = os.path.join('..', 'config', 'room')
os.chdir(path)
room = parse_room(r_id + '.xml')

print json.dumps(room, indent=1)