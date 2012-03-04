function capAcceleration(p) {
	if (p.a.r > p.maxAcc) p.a.r = p.maxAcc;

	var a_proj_v = polToCart(pol(p.a.r, p.a.th - p.v.th));

	if (p.v.r >= p.maxVel && a_proj_v.x > 0) {
	    //If we're already going maxVel in one direction, don't allow further acceleration
	    a_proj_v.x = 0;
	} else {
	    //if the acceleration is above maxAcc, it will allow us to exceed maxVel in the
	    //next step
	    var maxAcc = (p.maxVel - p.v.r);
	    if (maxAcc > 0 && a_proj_v.x > maxAcc) a_proj_v.x = maxAcc;
	}

	if (a_proj_v.y > p.maxVel) a_proj_v.y = p.maxVel;

	a_proj_v = cartToPol(a_proj_v);
	var new_a = pol(a_proj_v.r, a_proj_v.th + p.v.th);
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
	    var oneAdjV = getCollisionVelocityAdjustment(p1, p2);
	    var twoAdjV = getCollisionVelocityAdjustment(p2, p1);
	    var oneToTwoA = getCollisionAdjustment(p1, p2);
	    var twoToOneA = getCollisionAdjustment(p2, p1);

	    p1.v = addPolarVectors(p1.v, oneAdjV, 1);
	    p2.v = addPolarVectors(p2.v, twoAdjV, 1);
	    
	    p1.a = addPolarVectors(p1.a, oneToTwoA, -1 * p2.mass / p1.mass);
	    p1.a = addPolarVectors(p1.a, twoToOneA, 1 * p2.mass / p1.mass);
	    p2.a = addPolarVectors(p2.a, oneToTwoA, 1 * p1.mass / p2.mass);
	    p2.a = addPolarVectors(p2.a, twoToOneA, -1 * p1.mass / p2.mass);
	}
    }
}

//This is the velocity added to p1
function getCollisionVelocityAdjustment(p1, p2) {
	var angle1To2 = cartToPol({'x' : p2.x - p1.x, 'y' : p2.y - p1.y}).th;

	var v1i = polToCart(pol(p1.v.r, - angle1To2 + p1.v.th));
	if (v1i.x < 0) v1i.x = 0;

	var v2i = polToCart(pol(p2.v.r,- angle1To2 + p2.v.th));
	if (v2i.x > 0) v2i.x = 0;

	var v1fx = (p1.mass * v1i.x + p2.mass * v2i.x + p2.mass*(v2i.x - v1i.x)) / (p1.mass + p2.mass);

	return pol(- v1i.x + v1fx, angle1To2);
};

function getCollisionAdjustment(p1, p2) {
    var angle1To2 = cartToPol({'x' : p2.x - p1.x, 'y' : p2.y - p1.y}).th;

    //We need to transfer any current acceleration into the other player into them as well
    var a_rel = polToCart(pol(p1.a.r, angle1To2 - p1.a.th));
    
    var r = a_rel.x > 0 ? a_rel.x : 0;
    
    return pol(r, angle1To2);
}

function updateVelocity(p) {
	var a = polToCart(p.a);
	var v = polToCart(p.v);

	var maxV = p.v.r > p.maxVel ? p.v.r : p.maxVel;

	v.x += a.x;
	v.y +=  a.y;

	p.v = cartToPol(v);
	if (p.v.r > maxV) p.v.r = maxV;
}

function moveObject(p) {
	v = polToCart(p.v);
	p.x += v.x;
	p.y += v.y;
}
