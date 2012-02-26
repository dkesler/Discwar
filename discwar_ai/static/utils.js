function filterByType(type) {
	return function theFilter(element, index, array) {
		return type == element.type;
	}
}

function filterCollidableObjects(element, index, array) {
	return !isOutOfBoard(element.x, element.y);
}

function getPlayer(player) {
	return collidableObjects.filter(filterByType(player))[0];
}

function getOtherPlayer(me, all) {
	if (me.type == 'player0') return all.filter(filterByType('player1'))[0]
	else return all.filter(filterByType('player0'))[0]
}