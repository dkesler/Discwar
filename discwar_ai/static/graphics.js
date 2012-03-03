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
	ctx.arc(settings.maxWidth/2, settings.maxHeight/2, settings.boardRadius, 0, 2*Math.PI, true);
	ctx.fill();
}

function loadImages() {
	for (img in images) {
		loaded_images[img] = new Image();
		loaded_images[img].src = images[img];
	}
}