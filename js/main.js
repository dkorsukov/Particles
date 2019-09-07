"use strict";

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

Element.prototype.hasClass = function(cls) {
	return !!~Array.prototype.indexOf.call(this.classList, cls);
}

CanvasRenderingContext2D.prototype.clearCompletely = function() {
	this.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

CanvasRenderingContext2D.prototype.lineFromTo = function(obj1, obj2, width, color) {
	this.beginPath();
	this.moveTo(obj1.x, obj1.y);
	this.lineTo(obj2.x, obj2.y);
	this.closePath();

	this.shadowBlur = 0;
	this.lineWidth = width;
	this.strokeStyle = color;
	this.stroke();
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

	let particleConfig = {
		minR: 3.5,	// min radius
		maxR: 7,	 // max radius
		s: 3,	 // speed
		maxAcc: 1.5,	 // max acceleration
		maxS: 7,	// max speed
		sb: 7,	 // shadow blur
		colors: [	 // colors list
			"#FFFFFF"
		],
		lw: 0.1,	// width of binding line
		lc: "#FFFFFF"	 // color of binding line
	};

	let rainbowColors = ["#FF6347", "#FF8C00", "#EDFF2F", "#008000", "#ADD8E6", "#1E90FF", "#BE52BE"];

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

			this.ispeed = Math.min(speed, maxSpeed);	// initial speed
			this.speed = Math.min(speed, maxSpeed);
			this.maxSpeed = maxSpeed;
			this.acceleration = acceleration;
			
			this.xdm = Math.random() > 0.5 ? -1 : 1;	// X direction
			this.ydm = Math.random() < 0.5 ? -1 : 1;	// Y direction

			this.radius = radius;
		}

		setAreaStyle() {
			[this.area.fillStyle, 
			 this.area.shadowColor, 
			 this.area.shadowBlur] = [this.color, this.sc, this.sb];
		}

		update() {
			this.x += this.speed * this.xdm;
			this.y += this.speed * this.ydm;

				// switch direction and increase speed if particle abroad canvas
			if (this.x < this.radius + this.sb) {  // left side
				this.xdm = 1;
				this.speed += this.acceleration;
			} else if (this.x > this.area.canvas.width - this.radius - this.sb) {  // right side
				this.xdm = -1;
				this.speed += this.acceleration;
			}

			if (this.y < this.radius + this.sb) {	 // top side
				this.ydm = 1;
				this.speed += this.acceleration;
			} else if (this.y > this.area.canvas.height - this.radius - this.sb) {	// bottom side
				this.ydm = -1;
				this.speed += this.acceleration;
			}

			if (this.speed >= this.maxSpeed) {	// reset speed
				this.speed = this.ispeed;
			}
		}
	}	
		/* --------------------- */ 

		/* PARTICLES COLLECTION CLASS */
	class ParticlesCollection {
		constructor(particlesArea, particlesNumber) {
			this.pa = particlesArea;	// particles area
			this.storage = [];
			this.length = particlesNumber;

			this.pbd = Math.max( particlesNumber * 3.5, 1e2 );	// distance for particles bind

			this.fillStorage();

			this.loop = null;
		}

		fillStorage() {
			let pcr = particleConfig.maxR,	 // max radius from particle config
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
					acceleration: Math.random() * (particleConfig.maxAcc - 0.5) + 0.5,
					radius: Math.random() * ( pcr - particleConfig.minR ) + particleConfig.minR,
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
			this.pa.clearCompletely();
		}
		
		drawParticles() {
			this.storage.forEach( p => p.draw() );
		}

		updateParticles() {
			this.storage.forEach( p => p.update() );
		}

		freeze() {
			cancelAnimationFrame(this.loop);
		}

		bindParticles(distance) {
			let s = this.storage; // storage

			for (let i = 0; i < s.length; i++) {
				let bindWith = s.filter( p => { // filter by distance between two particles
					let distanceVector = new Vector(p.x - s[i].x,	// Vector connecting two particles
																					p.y - s[i].y);

					return distanceVector.length <= distance;																
				} );

				for (let k = 0; k < bindWith.length; k++) {
					this.pa.lineFromTo(s[i], bindWith[k], particleConfig.lw, particleConfig.lc);
				}
			}
		}

		requestActionFrame() {
			this.clearParticles();
			this.updateParticles();
			this.drawParticles();
			this.bindParticles(this.pbd);
			
			this.loop = requestAnimationFrame( this.requestActionFrame.bind(this) );
		}

		requestActionLoop() {
			requestAnimationFrame( collection.requestActionFrame.bind(this) );
		}
	}	
		/* -------------------------- */

	let particlesN = ~~(canvasConfig.w / 50); 

	let collection = new ParticlesCollection( ctx, Math.max( particlesN, 0x0f ) );
	collection.requestActionLoop();

		/* CONTROLS */
	let optionsContainer = document.querySelector(".options-list"),
			optionsToggleBtn = document.querySelector(".options__toggle-btn");

	optionsToggleBtn.addEventListener("click", evt => {
		if ( evt.target.hasClass("open-btn") ) {
			optionsContainer.classList.remove("hidden");
			evt.target.classList.remove("open-btn");
			evt.target.classList.add("close-btn");
		} else {
			optionsContainer.classList.add("hidden");
			evt.target.classList.remove("close-btn");
			evt.target.classList.add("open-btn");			
		}
	});		

	let sliders = document.querySelectorAll(".slider");

	let setSliderValue = (slider, val) => {
		let thumb = slider.querySelector(".slider-thumb")

		thumb.style.width = val + "%";

		thumb.parentNode.value = ~~val * slider.step;
		
		let valueContainer = document.querySelector( thumb.parentNode.getAttribute("data-for") );
		valueContainer.textContent = (~~val * slider.step).toFixed(2);

		if (thumb.parentNode.oninput) {
			thumb.parentNode.oninput.call(null, {
				target: thumb.parentNode
			});
		}	
	} 

	for (let i = 0; i < sliders.length; i++) {	// init sliders
		sliders[i].value = 0;
		sliders[i].step = sliders[i].getAttribute("step");

		sliders[i].addEventListener("mousedown", evt => {
			if (evt.buttons !== 1) return false;

			let target = evt.target;

			if ( target.hasClass("slider-thumb") ) {
				target = target.parentNode;
			}

			let onePercentValue = target.offsetWidth / 100;

			setSliderValue(target, evt.offsetX / onePercentValue);

			window.onmousemove = evt => {
				let val = (evt.clientX - 
									 optionsContainer.getBoundingClientRect().left - 
									 target.offsetLeft) / onePercentValue;

				if (val < 0) {
					val = 0;
				} else if (val > 100) {
					val = 100;
				}

				setSliderValue(target, val);
			}

			window.addEventListener("mouseup", () => {
				window.onmousemove = null;
			});
		});
	}

	let numberInput = document.querySelector(".options-list__number-input"),
			colorInput = document.querySelector(".options-list__color-input"),
			rainbowCheckbox = document.querySelector(".options-list__rainbow"),
			radiusInput = document.querySelector(".options-list__radius-input"),
			distanceInput = document.querySelector(".options-list__distance-input"),
			speedInput = document.querySelector(".options-list__speed-input"),
			lineWidthInput = document.querySelector(".options-list__line-width-input"),
			lineColorInput = document.querySelector(".options-list__line-color-input");

	let hexRegExp = /#([0-9A-F]{2}){3}/i;

	setSliderValue(numberInput, collection.length / numberInput.step);
	colorInput.value = particleConfig.colors[0];
	rainbowCheckbox.checked = false;
	setSliderValue( radiusInput, particleConfig.maxR * (1 / radiusInput.step) );
	setSliderValue(distanceInput, collection.pbd / distanceInput.step);
	setSliderValue(speedInput, particleConfig.maxS);
	setSliderValue( lineWidthInput, particleConfig.lw * (1 / lineWidthInput.step) );
	lineColorInput.value = particleConfig.lc;

	numberInput.oninput = evt => {
		collection.length = evt.target.value;
		collection.reset();
	};

	colorInput.addEventListener("input", evt => {
		if ( hexRegExp.test(evt.target.value) ) {
			particleConfig.colors[0] = evt.target.value;
			collection.reset();
		}
	});

	rainbowCheckbox.addEventListener("input", evt => {
		if (evt.target.checked) {
			colorInput.disabled = true;
			particleConfig.colors = rainbowColors.slice();
			collection.reset();
		} else {
			colorInput.disabled = false;
			particleConfig.colors.length = 1;
			particleConfig.colors[0] = "#FFFFFF";
			colorInput.value = "#FFFFFF";
			collection.reset();
		}
	});

	radiusInput.oninput = evt => {
		particleConfig.maxR = evt.target.value;
		collection.reset();	
	}

	distanceInput.oninput = evt => {
		collection.pbd = evt.target.value;
	}

	speedInput.oninput = evt => {
		particleConfig.maxS = evt.target.value;
		collection.reset();
	}

	lineWidthInput.oninput = evt => {
		particleConfig.lw = evt.target.value;
	}

	lineColorInput.addEventListener("input", evt => {
		if ( hexRegExp.test(evt.target.value) ) {
			particleConfig.lc = evt.target.value;
		}
	});
		/* -------- */
});

console.timeEnd("Execution time: ");