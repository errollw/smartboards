#!/usr/bin/env python

import sys
import json
import cgi
import os

fs = cgi.FieldStorage()

sys.stdout.write("Content-Type: application/json")

sys.stdout.write("\n")
sys.stdout.write("\n")

result = {}
result['success'] = True

sys.stdout.write(json.dumps(result,indent=1))
sys.stdout.write("\n")
sys.stdout.close()

d = {}
for k in fs.keys():
    d[k] = fs.getvalue(k)

path = os.path.join('..', 'content', d['user'] + '.svg')
f = open(path,"w")
f.write(d["svg_data"])
f.close()