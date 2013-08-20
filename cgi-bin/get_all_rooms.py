#!/usr/bin/env python

import json
import os

from room import parse_room

# Init lists for populating JSON response
room_list = []

# Loop through all .xml config files in room dir
path = os.path.join('..', 'config', 'room')
os.chdir(path)
for f in os.listdir('.'):
    if f.endswith('.xml'):
        room_list.append(parse_room(f))

# Return header and room info as response
print "Content-type: application/json"
print
print json.dumps(room_list, indent=1)