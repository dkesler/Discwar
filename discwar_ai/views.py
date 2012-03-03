from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.template import Context, Template
from django.template.loader import get_template
import json
import math
import time
import random
import os

class cart(object):
	def __init__(self, x, y):
		self.x = x
		self.y = y
		
class pol(object):
	def __init__(self, r, th):
		self.r = r
		self.th = th
		

@csrf_exempt
def aggressive(request):
	try:
		json_data = json.loads(request.raw_post_data)
	
		me = json_data['me']
		all = json_data['all']
		settings = json_data['settings']
		them = getEnemy(me, all);
	
		towardsEnemy = cartToPol(cart(them['x'] - me['x'], them['y'] - me['y'])).th;
	except Exception as e:
		print e
	else:
		response = HttpResponse(json.dumps({'r' : me['maxAcc'], 'th' : towardsEnemy - math.pi/10 + random.random() * math.pi/5}), mimetype="application/javascript)")
		response['Access-Control-Allow-Origin'] = '*'
		response['Access-Control-Allow-Methods'] = 'POST'
		return response

def getEnemy(me, all):
	my_type = me['type']
	
	if (my_type == "player0"):
		return getByType(all, "player1");
	else:
		return getByType(all, "player0");


def getByType(all, type):
	return [x for x in all if x['type'] == type][0]

def cartToPol(c):
	r = math.sqrt(c.x*c.x + c.y*c.y)
	
	if c.x != 0:
		th = math.atan(c.y/c.x)
	else:
		th = math.copysign(math.pi/2, c.y)
		
	if c.x < 0:
		th += math.pi
		
	if c.y > 0 and c.x <= 0:
		th += 2 * math.pi;
		
	if th > 2 * math.pi:
		th -= 2 * math.pi;
		
	return pol(r, th)
	
def polToCart(p):
	x = p.r * math.cos(p.th)
	y = p.r * math.sin(p.th)
	
	return {'x' : x, 'y' : y}


def loadGame(request):
	avatars = os.listdir(os.path.join(os.path.dirname(__file__), "avatars"));
	names = [convertName(a) for a in avatars]
	d = {"avatars" : [{"src" : avatars[i], "name" : names[i]} for i in range(len(avatars))]}
	c = Context(d);
	t = get_template('discwar.html')
	response = HttpResponse(t.render(c))
	return response

def convertName(a):
	a = a.split('.')[0]
	split_a = a.split('_')
	return split_a[0].capitalize() + " " + split_a[1].capitalize()
