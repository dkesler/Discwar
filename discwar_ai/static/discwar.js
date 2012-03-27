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

var totalRunTime = 0;
function incrementTime() {

    totalRunTime += 16;    
    $("#runTime").html(totalRunTime/1000);

    for (n in collidableObjects) {
	capAcceleration(collidableObjects[n]);
    }
    
    for (n in collidableObjects) {
	for (n2 in collidableObjects) {
	    if (n < n2) checkForCollisions(collidableObjects[n], collidableObjects[n2]);
	}
    }
    
    for (n in collidableObjects) {
	updateVelocity(collidableObjects[n]);
	moveObject(collidableObjects[n]);
    }
    
    
    checkForGameEnd();

    if (running) {
	addAndRemovePowerups();
	addAndRemoveCollidableObjects();
	
	for (n in collidableObjects) {
	    collidableObjects[n].accelMethod(collidableObjects[n], collidableObjects);
	}
	
	window.setTimeout(incrementTime, 16);
    } else {
	if (settings.autoRun == 1) onGameStart();
    }
}

function drawFrame() {
    
    if (running) {
	
	ctx.clearRect(0, 0, settings.maxWidth, settings.maxHeight);
	
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
    if (framesSinceGeneration > settings.minFramesPerObject && Math.random() < framesSinceGeneration / settings.maxFramesPerObject) {
	collidableObjects.push(initCollidableObject());
        framesSinceGeneration = 0;
    } else {
	framesSinceGeneration += 1;
    }
}

var framesSinceLastPowerup = 0;
function addAndRemovePowerups() {
    var powerups = collidableObjects.filter(filterByType('powerup'));
    for (p in powerups) {
	if (powerups[p].takenBy !== undefined) {
	    var affectedPlayer = collidableObjects.filter(filterByType(powerups[p].takenBy))[0];
	    affectedPlayer.mass += settings.powerupMassAdjustment;
	    affectedPlayer.maxAcc += settings.powerupMaxAccAdjustment;
	    $("#" + affectedPlayer.type + "Powerups").html(parseInt($("#" + affectedPlayer.type + "Powerups").html()) + 1);
	}
    }
    
    if (powerups.length < settings.maxPowerups && framesSinceLastPowerup > settings.minFramesPerPowerup && Math.random() < framesSinceLastPowerup / settings.maxFramesPerPowerup) {
	collidableObjects.push(initPowerup());
        framesSinceLastPowerup = 0;
    } else {
        framesSinceLastPowerup += 1;
    }



    collidableObjects = collidableObjects.filter(filterOutTakenPowerups);
}

function isOutOfBoard(x, y) {
	return Math.sqrt(Math.pow(x - settings.maxWidth/2, 2) + Math.pow(y - settings.maxHeight/2, 2)) > settings.boardRadius
}

function initCollidableObject() {
	var dir = Math.random() * 2 * Math.PI;
	var straight = Math.random() > .5;
	return {
		'radius' : settings.objectRadius,
		'type' : straight ? 'straight' : 'spiral',
		'mass' : settings.neutralObjectMass,
		'x' : settings.maxWidth/2 + 1,
		'y' : settings.maxHeight/2 + 1,
		'color' : 'rgb(227,200,25)',
		'maxAcc' : 1,
		'maxVel' : settings.maxVel,
		'v' : {'r' : 0, 'th' : dir},
		'a' : {'r' : 0, 'th' : dir},
		'accelMethod' : straight ? straightAccel : spiralAccel,
		'dir' : dir
	};
}

function initPowerup() {
    var dir = Math.random() * 2 * Math.PI;
    var dist = settings.boardRadius - 1;
    var pos = polToCart({'r' : dist, 'th' : dir});
    return {
	'radius' : settings.objectRadius,
	'type' : 'powerup',
	'mass' : 1,
	'x' : pos.x + settings.maxWidth/2,
	'y' : pos.y + settings.maxHeight/2,
	'color' : 'rgb(50, 200, 100)',
	'maxAcc' : 0,
	'maxVel' : 0,
	'v' : {'r' : 0, 'th' : 0},
	'a' : {'r' : 0, 'th' : 0},
	'accelMethod' : stayStill
    };
}

function checkForGameEnd() {
	var p1 = getPlayer('player0');
	if (isOutOfBoard(p1.x, p1.y)) {
	    if (settings.autoRun != 1) 
		window.alert("Player 2 wins!");
	    $("#player1Wins").html( parseInt($("#player1Wins").html()) + 1);
	    onGameEnd();
	    return;
	}

	var p2 = getPlayer('player1');
	if (isOutOfBoard(p2.x, p2.y)) {
		$("#player0Wins").html( parseInt($("#player0Wins").html()) + 1);
		if (settings.autoRun != 1) 
		    window.alert("Player 1 wins!");
		onGameEnd();
	}

	if (totalRunTime/1000 > settings.maxGameTimeSeconds) {
	    if (settings.autoRun != 1) 
		window.alert("Draw.  Players are out of time.");
	    onGameEnd();
	}
}