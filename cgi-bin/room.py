#!/usr/bin/env python

import xml.etree.ElementTree as ET
from utils import indent

def make_room(room):

    # Set 'room' as root element
    root = ET.Element('room')
    root.set('id', room['id'])

    ET.SubElement(root, 'name').text = room['name']
    ET.SubElement(root, 'last-mod').text = str(room['last-mod'])

    # Add room's tags
    tags_elem = ET.SubElement(root, 'tags')
    for tag in room['tags']:
        ET.SubElement(tags_elem, 'tag').text = tag

    # Add element for each user
    users_elem = ET.SubElement(root, 'users')
    for u_id, vals in room['users'].iteritems():
        user_elem = ET.SubElement(users_elem, 'user')
        user_elem.set('id', u_id)
        ET.SubElement(user_elem, 'name').text = vals['name']
        ET.SubElement(user_elem, 'status').text = vals['status'] 

        if 'website_url' in vals:
            web_elem = ET.SubElement(user_elem, 'website')
            ET.SubElement(web_elem, 'url').text = vals['website_url']
            ET.SubElement(web_elem, 'position').text = vals['website_pos']

    return root;


# Parse a room config file to append to JSON response
def parse_room(filename):
    
    tree = ET.parse(filename)
    root = tree.getroot()

    users = []
    for user in root.find('users'):

        user_json = {
            'id':     user.get('id'),
            'status': user.find('status').text,
            'name':   user.find('name').text
        };

        website = user.find('website')
        if website is not None:
            user_json['website_url'] = website.find('url').text
            user_json['website_pos'] = website.find('position').text

        users.append(user_json);

    tags = []
    for tag in root.find('tags'):
        tags.append(tag.text)
    
    return {
        'id' : root.get('id'),
        'name' : tree.find('name').text,
        'last_mod' : tree.find('last-mod').text,
        'tags': tags,
        'users': users
    }