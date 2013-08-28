#!/usr/bin/env python

import sys
import json
import cgi
import os
import cgitb; cgitb.enable()

try: # Windows needs stdio set for binary mode.
    import msvcrt
    msvcrt.setmode (0, os.O_BINARY) # stdin  = 0
    msvcrt.setmode (1, os.O_BINARY) # stdout = 1
except ImportError:
    pass

form = cgi.FieldStorage()

# A nested FieldStorage instance holds the file and uid
fileitem = form['file']
uid = form.getvalue('pic_u_id')

# Message to be returned
result = {}

# Test if the file was uploaded
if fileitem.filename:
   
   	# strip leading path from file name to avoid directory traversal attacks
   	fn = os.path.basename(fileitem.filename)

   	# create uid filename using uid and fn extention
   	fn_ext = fn.split('.')[-1];
   	uid_fn = uid + '.' + fn_ext;

   	# form path and write image out
	path = os.path.join('..', 'images', 'profile-pic', uid_fn)
   	open(path, 'wb').write(fileitem.file.read())
   	result['success'] = True
   
else:
   	result['success'] = False

# Write back message
sys.stdout.write("Content-Type: application/json\n\n")
sys.stdout.write(json.dumps(result,indent=1))
sys.stdout.write("\n")
sys.stdout.close()