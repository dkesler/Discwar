from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.template import Context, Template
from django.template.loader import get_template
import json
import math
import time
import random
import os
import traceback

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

@csrf_exempt
def pusher_robot(request):
	try:
		json_data = json.loads(request.raw_post_data)
	
		me = json_data['me']
		all = json_data['all']
		settings = json_data['settings']
		powerups = getByType(all, 'powerup')
		them = getEnemy(me, all)

		if len(powerups) > 0 and getDistFromCenter(getNearest(me, powerups), settings) < settings['boardRadius'] - 1.3 * settings['playerRadius'] and me['mass'] < them['mass'] * 2:
			a = goForPowerup(me, all, settings)
		elif me['mass'] < them['mass'] or (getDistFromCenter(me, settings) > settings['boardRadius'] - 5 * settings['playerRadius'] and getDistFromCenter(me, settings) > getDistFromCenter(them, settings) and getDist(me, them) < 3 * settings['playerRadius']):
			a = panic(me, all, settings)
		elif getDist(me, them) < 6 * settings['playerRadius'] and getDist(me, getCenterAsObj(settings)) > 3 * settings['playerRadius']:
			a  = zone(me, all, settings)
		else:
			a = goForEnemy(me, all, settings)

		response = HttpResponse(json.dumps(a), mimetype="application/javascript)")
	except Exception as e:
		traceback.print_exc()
		print e
	else:
		response['Access-Control-Allow-Origin'] = '*'
		response['Access-Control-Allow-Methods'] = 'POST'
		return response

def panic(me, all, settings):
	towardsEnemy = getTowardsEnemy(me, all)
	towardsCenter = getTowards(me, getCenterAsObj(settings))
	sideToFavor = math.copysign(1, towardsCenter.th - towardsEnemy.th)
	orthogonal = towardsEnemy.th + sideToFavor * math.pi/4
	if (orthogonal > 2*math.pi):
		orthogonal -= 2*math.pi
	
	return {'r' : me['maxAcc'], 'th' : orthogonal}

def getCenterAsObj(settings):
	return {'x' : settings['maxWidth'] / 2, 'y' : settings['maxHeight'] / 2}

def getDistFromCenter(obj, settings):
	return getDist(obj, {'x' : settings['maxWidth'] / 2, 'y' : settings['maxHeight'] / 2})
	

def getDist(a, b):
	return math.sqrt(math.pow(a['x'] - b['x'], 2) + math.pow(a['y'] - b['y'], 2))

def getTowardsEnemy(me, all):
	them = getEnemy(me, all);
	return getTowards(me, them)

def getTowards(me, it):
	return cartToPol(cart(it['x'] - me['x'], it['y'] - me['y']))

def goForPowerup(me, all, settings):
	powerups = getByType(all, 'powerup');
	if len(powerups) == 0:
		print 'how tf did i get here?'
		return None

	nearestPowerup = getNearest(me, powerups)
	return goForTarget(me, nearestPowerup)

def goForTarget(me, target):
	towardsTarget = getTowards(me, target)

	x = me['maxAcc']
	y = -polToCart(pol(me['v']['r'], me['v']['th'] - towardsTarget.th)).y;

	new = cartToPol(cart(x, y))
	return {'r' : new.r, 'th' : new.th + towardsTarget.th}

def getRemainingAcc(r, y):
	if math.fabs(y) > math.fabs(r) :
		return 0
	return math.sqrt(r*r - y*y) 

def goForEnemy(me, all, settings):
	them = getEnemy(me, all)
	towardsEnemy = getTowardsEnemy(me, all)
	x = me['maxAcc']
	y = -polToCart(pol(me['v']['r'], me['v']['th'] - towardsEnemy.th)).y;
	new = cartToPol(cart(x, y))
	return {'r' : new.r, 'th' : new.th + towardsEnemy.th}

def getPositionInBasis(cart, basis):
	posPol = cartToPol(cart)
	posPol.th -= basis.th
	return polToCart(posPol)
	
def zone(me, all, settings):
	them = getEnemy(me, all)
	theirV = polToCart(pol(them['v']['r'], them['v']['th']))
	theirA = polToCart(pol(them['a']['r'], them['a']['th']))
	them['x'] = them['x'] + theirV.x + theirA.x
	them['y'] = them['y'] + theirV.y + theirA.y

	towardsEnemy = getTowardsEnemy(me, all)
	centerToEnemy = getTowards(getCenterAsObj(settings), them)

	myPos = getPositionInBasis(cart(me['x'] - settings['maxWidth']/2, me['y'] - settings['maxHeight'] / 2), centerToEnemy);
	theirPos = getPositionInBasis(cart(them['x'] - settings['maxWidth']/2, them['y'] - settings['maxHeight'] / 2), centerToEnemy);

	x = math.copysign(me['maxAcc'], - myPos.x + theirPos.x)
	y = -myPos.y
	#x = math.copysign(getRemainingAcc(me['maxAcc'], y), - myPos.x + theirPos.x)

	new = cartToPol(cart(x, y))

	return {'r' : new.r, 'th' : new.th + centerToEnemy.th}
	

def getNearest(me, others):
	minDist = 9999999
	minOther = None

	for other in others:
		dist = getDist(me, other)
		if dist < minDist:
			minDist = dist
			minOther = other

	return other
		

def getEnemy(me, all):
	my_type = me['type']
	
	if (my_type == "player0"):
		return getFirstByType(all, "player1");
	else:
		return getFirstByType(all, "player0");

def getFirstByType(all, type):
	return getByType(all, type)[0];

def getByType(all, type):
	return [x for x in all if x['type'] == type]

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
	
	return cart(x, y)


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
