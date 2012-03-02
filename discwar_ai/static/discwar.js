var running = false;
var ctx;
var collidableObjects;

var requestAnimFrame = window.requestAnimationFrame       || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame    || 
    window.oRequestAnimationFrame      || 
    window.msRequestAnimationFrame     || 
    function(callback) {
        window.setTimeout(callback, 16);
};

function drawFrame() {

	for (n in collidableObjects) {
		collidableObjects[n].accelMethod(collidableObjects[n], collidableObjects);
		capAcceleration(collidableObjects[n]);
	}

	for (n in collidableObjects) {
		for (n2 in collidableObjects) {
			if (n != n2) checkForCollisions(collidableObjects[n], collidableObjects[n2]);
		}
	}

	for (n in collidableObjects) {
		updateVelocity(collidableObjects[n]);
		moveObject(collidableObjects[n]);
	}


	checkForGameEnd();

	if (running) {
		addAndRemoveCollidableObjects();

		ctx.clearRect(0, 0, maxWidth, maxHeight);

		drawBoard();

		for (n in collidableObjects) {
			drawObject(collidableObjects[n]);
		}

		requestAnimFrame(drawFrame);
	}
}


var framesSinceGeneration = 0;
function addAndRemoveCollidableObjects() {
	collidableObjects = collidableObjects.filter(filterCollidableObjects);
	if (framesSinceGeneration > 120) {
		collidableObjects.push(initCollidableObject());
		framesSinceGeneration = 0;
	} else {
		framesSinceGeneration += 1;
	}
}

function isOutOfBoard(x, y) {
	return Math.sqrt(Math.pow(x - maxWidth/2, 2) + Math.pow(y - maxHeight/2, 2)) > boardRadius
}

function initCollidableObject() {
	var dir = Math.random() * 2 * Math.PI;
	var straight = Math.random() > .5;
	return {
		'radius' : objectRadius,
		'type' : straight ? 'straight' : 'spiral',
		'mass' : 2,
		'x' : maxWidth/2 + 1,
		'y' : maxHeight/2 + 1,
		'color' : 'rgb(227,200,25)',
		'maxAcc' : 1,
		'maxVel' : maxVel,
		'v' : {'r' : 0, 'th' : dir},
		'a' : {'r' : 0, 'th' : dir},
		'accelMethod' : straight ? straightAccel : spiralAccel,
		'dir' : dir
	};
}

function checkForGameEnd() {
	var p1 = getPlayer('player0');
	if (isOutOfBoard(p1.x, p1.y)) {
		window.alert("Player 2 wins!");
		onGameEnd();
		return;
	}

	var p2 = getPlayer('player1');
	if (isOutOfBoard(p2.x, p2.y)) {
		window.alert("Player 1 wins!");
		onGameEnd();
	}
}