function capAcceleration(p) {
	if (p.a.r > p.maxAcc) p.a.r = p.maxAcc;

	var a_proj_v = polToCart({'r' : p.a.r, 'th' : p.a.th - p.v.th});

	if (p.v.r >= p.maxVel && a_proj_v.x > 0) {
	    //If we're already going maxVel in one direction, don't allow further acceleration
	    a_proj_v.x = 0;
	} else {
	    //if the acceleration is above maxAcc, it will allow us to exceed maxVel in the
	    //next step
	    var maxAcc = (p.maxVel - p.v.r) / settings.accelFactor;
	    if (a_proj_v.x > maxAcc) a_proj_v.x = maxAcc;
	}

	a_proj_v = cartToPol(a_proj_v);
	var new_a = {'r' : a_proj_v.r, 'th' : a_proj_v.th + p.v.th};
	p.a = new_a;
}

function checkForCollisions(p1, p2) {
    var dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    if (dist < p1.radius + p2.radius) {
	if (p1.type.indexOf('player') == 0 && p2.type == 'powerup') {
	    p2.takenBy = p1.type;
	} else if (p1.type == 'powerup' && p2.type.indexOf('player') == 0) {
	    p1.takenBy = p2.type;
	} else {
	    var oneToTwo = getCollisionAdjustment(p1, p2);
	    var twoToOne = getCollisionAdjustment(p2, p1);
	    
	    p1.a = addPolarVectors(p1.a, oneToTwo, -1 * p2.mass / p1.mass);
	    p1.a = addPolarVectors(p1.a, twoToOne, 1 * p2.mass / p1.mass);
	    p2.a = addPolarVectors(p2.a, oneToTwo, 1 * p1.mass / p2.mass);
	    p2.a = addPolarVectors(p2.a, twoToOne, -1 * p1.mass / p2.mass);
	}
    }
}

function getCollisionAdjustment(p1, p2) {
	var angle1To2 = cartToPol({'x' : p2.x - p1.x, 'y' : p2.y - p1.y}).th;

	var v_rel = polToCart({'r' : p1.v.r, 'th' : angle1To2 - p1.v.th});

	//We need to transfer any current acceleration into the other player into them as well
	var a_rel = polToCart({'r' : p1.a.r, 'th' : angle1To2 - p1.a.th});

	var r = v_rel.x > 0 ? v_rel.x : 0;
	r += a_rel.x > 0 ? a_rel.x : 0;

	return {'r' : r, 'th' : angle1To2};
}

function updateVelocity(p) {
	var a = polToCart(p.a);
	var v = polToCart(p.v);

	v.x += settings.accelFactor * a.x;
	v.y += settings.accelFactor * a.y;

	p.v = cartToPol(v);
}

function moveObject(p) {
	v = polToCart(p.v);
	p.x += v.x;
	p.y += v.y;
}
