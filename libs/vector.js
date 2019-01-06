function Vector(x, y) {
	this.x = x || 0;
	this.y = y || 0;

	this.length = Math.sqrt( Math.pow(this.x, 2) + Math.pow(this.y, 2) );
}