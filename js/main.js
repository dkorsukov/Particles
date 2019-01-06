/* -----HELPERS----- */

document.createDOMElem = function(tag, attrs) {
	try {
		var _domelem = document.createElement(tag);

		for (var attr in attrs) {
			_domelem.setAttribute(attr, attrs[attr])
		}

		return _domelem;
	} catch (e) {
		console.error(e);
	}	
}

CanvasRenderingContext2D.prototype.clearCompletely = function() {
	this.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

const mv = {
	PI: Math.PI,
	doublePI: Math.PI * 2,
	halfPI: Math.PI / 2
} 

/* ----------------- */

console.time("Execution time: ");

window.addEventListener("load", () => {
	let canvasConfig = {
		w: window.innerWidth,
		h: window.innerHeight,
		bg: "#353535",
		class: "particles-area"
	};

	let canvas = document.createDOMElem("canvas", 
															{ class: canvasConfig.class, 
																width: canvasConfig.w, 
																height: canvasConfig.h,
																style: `background: ${canvasConfig.bg}` }),
			wrapper	=	document.querySelector(".page-wrapper");

	let resizeCanvas = () => {	// set config values to canvas size
		[canvas.width, canvas.height] = [canvasConfig.w, canvasConfig.h];
	}																	

	window.addEventListener("resize", () => {	 // resize canvas with the window 
		[canvasConfig.w, canvasConfig.h] = [window.innerWidth, window.innerHeight];

		resizeCanvas();
	});

	wrapper.appendChild(canvas);
						
	let ctx = canvas.getContext("2d");

		/* ANY CANVAS OBJECT CLASS */
	class canvasObject {
		constructor({ s_x, s_y, s_c, s_sb, s_sc, s_r }) {
			if ( isNaN(s_x) || isNaN(s_y) || isNaN(s_r) || isNaN(s_sb) ||
					typeof s_c !== "string" || typeof s_sc !== "string" ) {
				throw new Error("Incorrect data type");
			}			

			this.x = parseFloat(s_x);
			this.y = parseFloat(s_y);

			this.color = s_c;
			this.sb = s_sb;	 // shadow blur
			this.sc = s_sc;	 // shadow color

			this.radius = s_r;
		}

		setAreaStyle() {
			[this.area.fillStyle, this.area.shadowColor, this.area.shadowBlur] = [this.color, this.sc, this.sb];
		}	
		
		clear() {
			this.area.clearRect(this.x - this.radius - this.sb,
													this.y - this.radius - this.sb,
													this.radius * 2 + this.sb * 2,
													this.radius * 2 + this.sb * 2);
		}

		draw() {
			this.area.beginPath();
			this.area.moveTo(this.x, this.y);
			this.area.arc(this.x, this.y, this.radius, 0, mv.doublePI, true);
			this.area.closePath();

			this.setAreaStyle();
			this.area.fill();
		}		
	}
		/* ----------------------- */

		/* CANVAS CURSOR CLASS */
  class Cursor extends canvasObject {
		constructor(area, { x, y, color, sBlur, sColor, radius }) {
			super({
				s_x: x,
				s_y: y,
				s_c: color,
				s_sb: sBlur,
				s_sc: sColor,
				s_r: radius
			});

			this.area = area;

			this.ix = x; 	// initial x
			this.iy = y; 	// initial y

			this.onmove = null;
		}

		update({x, y}) {
			this.x = x;
			this.y = y;
		}

		init() {
			this.area.canvas.style.cursor = "none";

			this.area.canvas.addEventListener("mousemove", (evt) => {
				cursor.clear();
				cursor.update({
					x: evt.offsetX,
					y: evt.offsetY 
				});

				if (this.onmove) {
					this.onmove.call(this);
				}

				cursor.draw();
			});			
		}
	}
		/* ------------------- */	

	let cursor = new Cursor(ctx, {
		x: ~~(canvasConfig.w / 2),
		y: ~~(canvasConfig.h / 2),
		color: "rgba(255, 255, 255, 1)",
		radius: 6,
		sBlur: 10,
		sColor: "#fff"
	});
	cursor.init();

	let particleConfig = {
		r: 8,	 // radius
		s: 1.9,	 // speed
		acc: 0.65,	// acceleration
		maxS: 7,	// max speed
		sb: 11,	 // shadow blur
		colors: [	 // list of possible colors
			"#12D800",
			"#B8860B",
			"#9400D3",
			"#008000",
			"#4682B4",
			"#FF6347",
			"#663399"
		]
	};

		/* SINGLE PARTICLE CLASS */
	class Particle extends canvasObject {
		constructor(area, {x, y, commonColor, sBlur, speed, maxSpeed, acceleration, radius}) {
			super({
				s_x: x,
				s_y: y,
				s_c: commonColor,
				s_sc: commonColor,
				s_sb: sBlur,
				s_r: radius
			});

			this.area = area;

			this.ispeed = speed;	// initial speed
			this.speed = speed;
			this.maxSpeed = maxSpeed;
			this.acceleration = acceleration;
			
			this.xdm = Math.random() > 0.5 ? -1 : 1;	// X direction
			this.ydm = Math.random() < 0.5 ? -1 : 1;	// Y direction

			this.radius = radius;
		}

		setAreaStyle() {
			[this.area.fillStyle, this.area.shadowColor, this.area.shadowBlur] = [this.color, this.sc, this.sb];
		}

		clear() {
			this.area.clearRect(this.x - this.radius - this.sb,
													this.y - this.radius - this.sb,
													this.radius * 2 + this.sb * 2,
													this.radius * 2 + this.sb * 2);
		}

		draw() {
			this.area.beginPath();
			this.area.moveTo(this.x, this.y);
			this.area.arc(this.x, this.y, this.radius, 0, mv.doublePI, true);
			this.area.closePath();

			this.setAreaStyle();
			this.area.fill();
		}

		update() {
			this.x += this.speed * this.xdm;
			this.y += this.speed * this.ydm;

			if (this.x < this.radius + this.sb) {
				this.xdm = 1;
				this.speed += this.acceleration;
			} else if (this.x > this.area.canvas.width - this.radius - this.sb) {
				this.xdm = -1;
				this.speed += this.acceleration;
			}

			if (this.y < this.radius + this.sb) {
				this.ydm = 1;
				this.speed += this.acceleration;
			} else if (this.y > this.area.canvas.height - this.radius - this.sb) {
				this.ydm = -1;
				this.speed += this.acceleration;
			}

			if (this.speed >= this.maxSpeed) {
				this.speed = this.ispeed;
			}
		}
	}	
		/* --------------------- */ 

		/* PARTICLES COLLECTION CLASS */
	class ParticlesCollection {
		constructor(particlesArea, particlesNumber, particlesTarget) {
			this.pa = particlesArea;	// particles area
			this.pt = particlesTarget;	// particles target
			this.storage = [];
			this.length = particlesNumber;

			this.pbd = Math.max( particlesNumber * 3.9, 95 );	// distance for particles bind

			this.fillStorage();
		}

		fillStorage() {
			let pcr = particleConfig.r,	 // radius from particle config
					doublePCR = 2 * pcr;

			for (let i = 1; i <= this.length; i++) {
				let tempParticleX = Math.random() * (this.pa.canvas.width - doublePCR) + pcr,
						tempParticleY = Math.random() * (this.pa.canvas.height - doublePCR) + pcr;

				let tempParticle = new Particle(this.pa, {
					x: tempParticleX,
					y: tempParticleY,
					commonColor: particleConfig.colors[ ~~(Math.random() * particleConfig.colors.length) ],
					sBlur: particleConfig.sb,
					speed: particleConfig.s,
					maxSpeed: Math.ceil( Math.random() * (particleConfig.maxS - particleConfig.s) + particleConfig.s ),
					acceleration: particleConfig.acc,
					radius: particleConfig.r
				});

				this.storage.push(tempParticle);
			}			
		}

		clearStorage() {
			this.storage = [];
		}

		reset() {
			this.clearStorage();
			this.fillStorage();
		}

		clearParticles() {
			this.storage.forEach( p => p.clear() );
		}
		
		drawParticles() {
			this.storage.forEach( p => p.draw() );
		}

		updateParticles() {
			this.storage.forEach( p => p.update() );
		}

		lineFromTo(obj1, obj2) {
			this.pa.beginPath();
			this.pa.moveTo(obj1.x, obj1.y);
			this.pa.lineTo(obj2.x, obj2.y);
			this.pa.closePath();

			this.pa.strokeStyle = "#fff";
			this.pa.stroke();
		}

		bindParticles(distance) {
			let s = this.storage; // storage

			for (let i = 0; i < s.length; i++) {
				for (let k = 0; k < s.length; k++ ) {
					if (k == i) continue;

					let distanceVector = new Vector(s[k].x - s[i].x,	// Vector connecting two particles
																					s[k].y - s[i].y); 

					if ( distanceVector.length <= distance ) {
						this.lineFromTo(s[i], s[k]);
					} else continue;	
				}
			}
		}

		bindWithTarget(distance) {
			let t = this.pt;

			this.storage.forEach( p => {
				let distanceVector = new Vector(p.x - t.x,	// Vector connecting particle with a target
																				p.y - t.y); 

				if ( distanceVector.length <= distance ) {
					this.lineFromTo(p, t);
				}		
			});		
		}

		actionLoop() {
			this.pa.clearCompletely();
			this.pt.draw();
			this.updateParticles();
			this.drawParticles();
			this.bindParticles(this.pbd);
			this.bindWithTarget(100);
			
			requestAnimationFrame( this.actionLoop.bind(this) );
		}
	}	
		/* -------------------------- */

	let particlesN = ~~(canvasConfig.w / 59); 

	let collection = new ParticlesCollection(ctx, Math.max( particlesN, 15 ), cursor);
	requestAnimationFrame( collection.actionLoop.bind(collection) );
});

console.timeEnd("Execution time: ");