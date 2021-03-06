var keys;
		
function getAccelMethod(me) {
	var type = $("#" + me.type + "Type").val();

	if ( type == "Manual") {
		return updateAccelerationFromKeys;
	} else if (type == "AggressiveJS") {
		return aggressiveAi;
	} else if (type == "DodgerJS") {
		return dodgerAi;
	} else if (type == "CenterJS") {
		return centerAi;
	} else if (type == "ServerAi") {
		return serverAi;
	}
}

function updateAccelerationFromKeys(player, all) {
	var playerKeys = keys[player.type];
	if (playerKeys.s) {
		var v = polToCart(player.v);
		var a = {'x' : -v.x, 'y' : -v.y};
		player.a = cartToPol(a);
		if (player.a.r > player.maxAcc) player.a.r = player.maxAcc;
	} else {

		var a = {'x' : 0, 'y' : 0};

		if (playerKeys.u) a.y -= 1;
		if (playerKeys.d) a.y += 1;
		if (playerKeys.r) a.x += 1;
		if (playerKeys.l) a.x -= 1;

		player.a = cartToPol(a);

		if (a.x != 0 || a.y != 0) player.a.r = player.maxAcc;
		else player.a.r = 0;
	}
}

function handleKeydown(event) {
    if (keys === undefined || keys.player0 === undefined || keys.player1 === undefined)
	return;

    if (event.which == 65) {
	keys.player0.l = true;
    } else if (event.which == 68) {
	keys.player0.r = true;
    } else if (event.which == 87) {
	keys.player0.u = true;
    } else if (event.which == 83) {
	keys.player0.d = true;
    } else if (event.which == 70) {
	keys.player0.s = true;
    } else if (event.which == 37) {
	keys.player1.l = true;
    } else if (event.which == 38) {
	keys.player1.u = true;
    } else if (event.which == 39) {
	keys.player1.r = true;
    } else if (event.which == 40) {
	keys.player1.d = true;
    } else if (event.which == 77) {
	keys.player1.s = true;
    }
}

function handleKeyup(event) {
   if (keys === undefined || keys.player0 === undefined || keys.player1 === undefined)
	return;
   
   if (event.which == 65) {
       keys.player0.l = false;
   } else if (event.which == 68) {
       keys.player0.r = false;
   } else if (event.which == 87) {
       keys.player0.u = false;
   } else if (event.which == 83) {
       keys.player0.d = false;
   } else if (event.which == 70) {
       keys.player0.s = false;
   } else if (event.which == 37) {
       keys.player1.l = false;
   } else if (event.which == 38) {
       keys.player1.u = false;
   } else if (event.which == 39) {
       keys.player1.r = false;
   } else if (event.which == 40) {
       keys.player1.d = false;
   } else if (event.which == 77) {
       keys.player1.s = false;
   }
}

function aggressiveAi(me, all) {
	var p2 = getOtherPlayer(me, all);
	var towardsEnemy = cartToPol({'x' : p2.x - me.x, 'y' : p2.y - me.y}).th;
	me.a =  {'r' : me.maxAcc, 'th' : towardsEnemy - Math.PI/10 + Math.random()*Math.PI/5};
}

function dodgerAi(me, all) {
	var p2 = getOtherPlayer(me, all);
	var towardsEnemy = cartToPol({'x' : p2.x - me.x, 'y' : p2.y - me.y});
	var towardsCenter = cartToPol({'x' : settings.maxWidth/2 - me.x, 'y' : settings.maxHeight/2 - me.y});
	if (towardsEnemy.r > settings.boardRadius/2 || towardsCenter.r > settings.boardRadius/2) {
	    centerAi(me, all);
	} else {
	    var sideToFavor = sign(- towardsEnemy.th + towardsCenter.th);
	    if (sideToFavor == 0) sideToFavor = 1;
	    var orthogonal = towardsEnemy.th + sideToFavor * Math.PI/2;
	    if (orthogonal > 2*Math.PI) orthogonal -= 2*Math.PI;
	    me.a = {'r' : me.maxAcc, 'th' : orthogonal - Math.PI/10 + Math.random()*Math.PI/5};
	}
}

function centerAi(me, all) {
	var p2 = getOtherPlayer(me, all);
	var towardsCenter = cartToPol({'x' : me.x - settings.maxWidth/2, 'y' : me.y - settings.maxWidth/2}).th;
	me.a = {'r' : -me.maxAcc, 'th' : towardsCenter};
}

function straightAccel(p1, all) {
	p1.a = {'r' : p1.maxAcc, 'th' : p1.dir};
}

function stayStill(p1, all) {
    p1.a = {'r' : 0, 'th' : 0};
}

function spiralAccel(p1, all) {
	var towardsEdge = cartToPol({'x' : p1.x - settings.maxWidth/2, 'y' : p1.y - settings.maxHeight/2});
	var velTowardsEdge = polToCart({'r' : p1.v.r, 'th' : - p1.v.th + towardsEdge.th}).x;
	var accelTowardsEdge = {'r' : .25 - velTowardsEdge, 'th' : towardsEdge.th};
	var orthogonal =  {'r' : 1, 'th' : towardsEdge.th + Math.PI / 2};
	var a = addPolarVectors(accelTowardsEdge, orthogonal, 1);
	if (a.r > p1.maxAcc) a.r = p1.maxAcc;
	p1.a = a;
}

var outstanding = {'player0' : null, 'player1' : null};
var maxRespTime = {'player0' : 0, 'player1' : 0};
function serverAi(me, all) {
    if (outstanding[me.type] == null) {
	outstanding[me.type] = new Date();
	$.ajax({
		type: 'POST',
		url:  $("#" + me.type + "Server").val(),
		data: JSON.stringify({'me' : me, 'all' : all, 'settings' : settings}),
		success : function(data) {
		    me.a = data;
		    var responseTime = new Date().getTime() - outstanding[me.type].getTime();
		    var current = parseInt($("#" + me.type + "LastResp").html());
		    $("#" + me.type + "LastResp").html((responseTime + current) / 2);
		    if (responseTime > maxRespTime[me.type]) maxRespTime[me.type] = responseTime;		    
		    $("#" + me.type + "MaxResp").html(maxRespTime[me.type]);
		    outstanding[me.type] = null;		    
		},
		dataType : "json"
	});
    }
}