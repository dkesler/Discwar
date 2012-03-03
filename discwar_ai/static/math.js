function sign(x) {
	return x > 0 ? 1 : (x < 0 ? -1 : 0);
}

function cartToPol(c) {
	var r = Math.sqrt(c.x*c.x + c.y*c.y);

	var th;

	if (c.x != 0) th = Math.atan(c.y/c.x);
	else th = sign(c.y) * Math.PI/2;

	if (c.x < 0) th += Math.PI;

	if (c.y > 0 && c.x >= 0) th += 2*Math.PI;

	if (th > 2*Math.PI) th -= 2*Math.PI;

	return {'r' : r, 'th' : th};
}

function polToCart(p) {
	var x = p.r * Math.cos(p.th);
	var y = p.r * Math.sin(p.th);

	return {'x' : x, 'y' : y};
}

function pol(r, th) {
    var p = {'r' : r, 'th' : th};
    if (r < 0) {
	p.r = -p.r;
	p.th += Math.PI;
    }

    if (p.th > 2 * Math.PI) p.th -= 2 * Math.PI;
    if (p.th < -2 * Math.PI) p.th += 2 * Math.PI;
    
    return p;
}

function addPolarVectors(p1, p2, weight) {
	var one = polToCart(p1);
	var two = polToCart(p2);

	one.x += weight * two.x;
	one.y += weight * two.y;

	return cartToPol(one);
}

