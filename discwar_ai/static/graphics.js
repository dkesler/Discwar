var images = {
	'dk' : {'src' : 'static/david_kesler.png'},
	'md' : {'src' : 'static/mark_drago.png'},
	'dg' : {'src' : 'static/dan_gant.png'},
	'dj' : {'src' : 'static/david_judd.png'},
	'dh' : {'src' : 'static/donald_higgins.png'},
	'dl' : {'src' : 'static/dennis_lipovsky.png'}
}

var loaded_images = {};

function init() {
	var game = document.getElementById("game");
	ctx = game.getContext('2d');
}

function drawObject(player) {

	ctx.beginPath();
	ctx.fillStyle = player.color;
	ctx.arc(player.x, player.y, player.radius, 0, 2*Math.PI, true);
	ctx.fill();

	if (player.img != null) {
		ctx.drawImage(loaded_images[player.img], player.x-27, player.y-27, 54, 54);
	}
}

function drawBoard() {
	ctx.beginPath();
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.arc(maxWidth/2, maxHeight/2, boardRadius, 0, 2*Math.PI, true);
	ctx.fill();
}

function loadImages() {
	for (img in images) {
		loaded_images[img] = new Image();
		loaded_images[img].src = images[img].src;
	}
}