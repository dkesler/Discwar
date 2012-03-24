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
	
	def sub(self, other):
		self_cart = polToCart(self)
		other_cart = polToCart(other)
		return cartToPol(cart(self_cart.x - other_cart.x, self_cart.y - other_cart.y))

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
def zoner_robot(request):
	try:
		json_data = json.loads(request.raw_post_data)
	
		me = json_data['me']
		all = json_data['all']
		settings = json_data['settings']
		powerups = getByType(all, 'powerup')
		them = getEnemy(me, all)
		a = zone(me, all, settings)
		response = HttpResponse(json.dumps(a), mimetype="application/javascript)")
	except Exception as e:
		traceback.print_exc()
		print e
	else:
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

		if getDistFromCenter(me, settings) > settings['boardRadius'] - 3 * settings['playerRadius'] and getDistFromCenter(me, settings) > getDistFromCenter(them, settings) and getDist(me, them) < 3 * settings['playerRadius']:
			a = panic(me, all, settings)
		elif len(powerups) > 0 and getDistFromCenter(getNearest(me, powerups), settings) < settings['boardRadius'] - 1.3 * settings['playerRadius'] and me['mass'] < them['mass'] * 2:
			a = goForPowerup(me, all, settings)
		elif me['mass'] < them['mass']:
			a = panic(me, all, settings)
		elif getDistFromCenter(me, settings) > getDistFromCenter(them, settings):
			a = panic(me, all, settings)
		elif getDist(me, them) < 6 * settings['playerRadius'] and getDist(them, getCenterAsObj(settings)) > 3 * settings['playerRadius']:
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

	#If the enemy and center aren't even close, just go towards the center
	diff = math.fabs(towardsEnemy.th - towardsCenter.th)
	if diff >= math.pi/2 and diff <= 3*math.pi/2:
		print "Difference between center and enemy %f, going directly for center" % diff
		return goForTarget(me, getCenterAsObj(settings))
	print "Difference between center and enemy %f, dodging" % diff


	#if the enemy and center are close, favor the side closer to the center
	if diff <= math.pi/2:
		sideToFavor = math.copysign(1, towardsCenter.th - towardsEnemy.th)
	else:
		if towardsCenter.th <= math.pi / 2:
			sideToFavor = 1
		else:
			sideToFavor = -1
	
	print "towards enemy: %f, side to favor : %d" % (towardsEnemy.th, sideToFavor)
	dirToGo = towardsEnemy.th + sideToFavor * math.pi / 4

	if (dirToGo > 2*math.pi):
		dirToGo -= 2*math.pi
	if dirToGo < 0:
		dirToGo += 2 * math.pi

	print "DirToGo: %f" % (dirToGo)

	v = pol(me['v']['r'], me['v']['th'])
	print "current v: %f, %f" % (v.r, v.th)
	desired_v = pol(me['maxVel'] * 4, dirToGo);
	print "desired v: %f, %f" % (desired_v.r, desired_v.th)
	new_a = desired_v.sub(v)
	
	print "accel: %f, %f" % (new_a.r, new_a.th)
	
	return {'r' : new_a.r, 'th' : new_a.th}

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
		return None

	nearestPowerup = getNearest(me, powerups)
	return goForTarget(me, nearestPowerup)

def goForTarget(me, target):
	towardsTarget = getTowards(me, target)

	x = me['maxAcc']
	y = -polToCart(pol(me['v']['r'], me['v']['th'] - towardsTarget.th)).y;

	new = cartToPol(cart(x, y))
	return {'r' : new.r, 'th' : new.th + towardsTarget.th}

def getRemaining(r, y):
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

def getCartInBasis(cart, basis):
	posPol = cartToPol(cart)
	posPol.th -= basis.th
	return polToCart(posPol)
	
def zone(me, all, settings):
	them = getEnemy(me, all)
	my_v_obj = polToCart(pol(me['v']['r'], me['v']['th']));
	theirV = polToCart(pol(them['v']['r'], them['v']['th']))
	theirA = polToCart(pol(them['a']['r'], them['a']['th']))
	#them['x'] = them['x'] + theirV.x
	#them['y'] = them['y'] + theirV.y

	towardsEnemy = getTowardsEnemy(me, all)
	centerToEnemy = getTowards(getCenterAsObj(settings), them)

	myPos = getCartInBasis(cart(me['x'] - settings['maxWidth']/2, me['y'] - settings['maxHeight'] / 2), centerToEnemy);
	#print "My pos in basis: %d, %d" % (myPos.x, myPos.y)
	myV = getCartInBasis(my_v_obj, centerToEnemy);
	#print "My v in basis: %f, %f" % (myV.x, myV.y)
	theirPos = getCartInBasis(cart(them['x'] - settings['maxWidth']/2, them['y'] - settings['maxHeight'] / 2), centerToEnemy);
	#print "Their pos in basis: %d, %d" % (theirPos.x, theirPos.y)

	x = math.copysign(me['maxAcc'], - myPos.x + theirPos.x)
	#if myV.x < 0:
	#	desired_x_velocity = me['maxVel']
	#	desired_y_velocity = myV.y;
	#else:

	desired_y_velocity = -myPos.y

	if (myPos.y > 30):
		desired_x_velocity = math.copysign(getRemaining(me['maxVel'], desired_y_velocity), - myPos.x + theirPos.x)
	else:
		desired_x_velocity = me['maxVel']
	
	#print "desired v in basis: %f, %f" % (desired_x_velocity, desired_y_velocity)

	desired_y_acc = desired_y_velocity - myV.y;
	desired_x_acc = desired_x_velocity - myV.x;

	#print "desired a in basis: %f, %f" % (desired_x_acc, desired_y_acc)

	new = cartToPol(cart(desired_x_acc, desired_y_acc))

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
	if th < 0:
		th += 2 * math.pi;
		
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
