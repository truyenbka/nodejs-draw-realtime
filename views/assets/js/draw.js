jQuery(function() {
	var url = window.location.hostname;
	var path_tokens = window.location.pathname.split('/');
	var stanza = path_tokens[path_tokens.length - 1];

	var positionx = '23';
	var positiony = '0';

	var doc = jQuery(document),
		canvas = jQuery('#paper');
	var color = '#000000';
	
	var drawing = false;
	var clients = {};
	var cursors = {};

	var socket = io.connect(location.origin, {'transports': ['websocket', 'polling']});

	var ctx = canvas[0].getContext('2d');

	var spessore = jQuery('#spessore').value;
	var colorem;

	var drawImage = function(src){
		if(typeof(src) == 'string'){
			var obj = new Image();
			obj.src= src;
			ctx.drawImage(obj, 0, 0);
		} else if(typeof(src) == 'object'){
			ctx.drawImage(src, 0, 0);
		}
	}


	// ctx setup
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.lineWidth = 2;
	window.selectImage = function(img, offsetX, offsetY){
		ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
		ctx.drawImage(img, offsetX, offsetY);
	}


	socket.on('working', function(data){
		if(data.to == window.me.id){
			ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
			setTimeout(function(){
				drawImage(data.src);
			}, 100);
			console.log('restore image', data);
		}
	})

	socket.on('setuproomser', function(data) {
		clients[data.id] = data;
		if(data.id != window.me.id){
			console.log(data.id + ' has been online');
			socket.emit('working', {
				to: data.id,
				src: canvas[0].toDataURL()
			});
		}
		jQuery('<div class="testochatser"><span>SERVER:</span> ' + data.inforoom + data.listautenti + '</div>').appendTo('#testichat');
	});


	jQuery('#scrivi').keypress(function(e) {
		var code = e.keyCode;
		if (code == '13') {
				socket.emit('chat', {
					'testochat': document.getElementById('scrivi').value,
					'id': me.id,
					'usernamerem': me.username,
					'room': stanza
				});
				jQuery('<div class="testochat"><span>ME:</span> ' + document.getElementById('scrivi').value + '</div>').appendTo('#testichat');
				document.getElementById('scrivi').value = '';

				var objDiv = document.getElementById("testichat");
				objDiv.scrollTop = objDiv.scrollHeight;
		}
	});

	
	// use ajax to send data canvas to server
	jQuery('#salvafoto').click(function() {
		var dataURL = canvas[0].toDataURL();
		console.log(dataURL);
		$.ajax({
		    type: "POST",
		    url: "",
		    data: { 
		        imgBase64: dataURL
		    }
		}).done(function(o) {
		    console.log('all_saved'); 
			});
		alert("Thanks !\nYou updated this image success !");
	});

	



	socket.on('chatser', function(data) {
		jQuery('<div class="testochat"><span>' + data.usernamerem + ':</span> ' + data.testochat + '</div>').appendTo('#testichat');
		var objDiv1 = document.getElementById("testichat");
		objDiv1.scrollTop = objDiv1.scrollHeight;
	});

	socket.on('listautentiser', function(data) {
		jQuery('<div class="testochatser"><span>SERVER:</span> ' + data.listautenti + '</div>').appendTo('#testichat');
	});

	socket.on('down', function(data){
		clients[data.id].drawing = true;
		clients[data.id].prev = clients[data.id].prev || {};
		clients[data.id].prev.x = data.x;
		clients[data.id].prev.y = data.y;
	})

	socket.on('up', function(data){
		if(!clients[data.id].drawing) return false;
		if(data.mode == '1'){
			// Rectangle
			draw_rect(clients[data.id].prev.x, clients[data.id].prev.y, data.x, data.y, {
				width:  data.sizepencil,
				color: data.color
			});
		} else if(data.mode == '2'){
			// Ellipse
			drawEllipse(clients[data.id].prev.x, clients[data.id].prev.y, data.x, data.y, {
				width:  data.sizepencil,
				color: data.color
			});
		} else {
			// Free style
			// Nope
		}
		clients[data.id].drawing = false;
	})

	socket.on('moving', function(data) {
		clients[data.id] = clients[data.id] || {};
		// if (!(data.id in clients)) {
		// 	cursors[data.id] = jQuery('<div class="cursor"><div class="identif">' + data.usernamerem + '</div>').appendTo('#cursors');
		// }
		// cursors[data.id].css({
		// 	'left': data.x,
		// 	'top': data.y
		// });
		// Is the user drawing?
		if (data.drawing && clients[data.id]) {
			// Draw a line on the canvas. clients[data.id] holds
			// the previous position of this user's mouse pointer

			if(data.mode == '1'){
				// Rectangle
				// Nope
			} else if(data.mode == '2'){
				// Ellipse
				// Nope
			} else {
				// Free style
				ctx.strokeStyle = data.color;
				drawLinerem(clients[data.id].prev.x, clients[data.id].prev.y, data.x, data.y, data.sizepencil, data.color);
				clients[data.id].prev.x = data.x;
				clients[data.id].prev.y = data.y;
			}
		}
		// Saving the current client state
		clients[data.id].state = data;
		clients[data.id].state.updated = jQuery.now();
	});

	var prev = {};

	canvas.on('mousedown', function(e) {
		e.preventDefault();
		drawing = true;
		prev.x = e.pageX;
		prev.y = e.pageY;
		socket.emit('mousedown', {
			'x': e.pageX,
			'y': e.pageY,
			'drawing': drawing,
			'color': $('#minicolore').minicolors('rgbaString'),
			'id': me.id,
			'usernamerem': me.username,
			'sizepencil': document.getElementById('spessore').value,
			'room': stanza,
			'mode': getMode()
		});
	});

	doc.bind('mouseup mouseleave', function(e) {
		if(!drawing) return false;
		if(getMode() == '1'){
			// Rectangle
			draw_rect(prev.x, prev.y, e.pageX, e.pageY, {
				width:  document.getElementById('spessore').value,
				color: $('#minicolore').minicolors('rgbaString')
			});
		} else if(getMode() == '2'){
			// Ellipse
			drawEllipse(prev.x, prev.y, e.pageX, e.pageY, {
				width:  document.getElementById('spessore').value,
				color: $('#minicolore').minicolors('rgbaString')
			});
		} else {
			// Free style
			// Nope
		}
		socket.emit('mouseup', {
			'x': e.pageX,
			'y': e.pageY,
			'drawing': drawing,
			'color': $('#minicolore').minicolors('rgbaString'),
			'id': me.id,
			'usernamerem': me.username,
			'sizepencil': document.getElementById('spessore').value,
			'room': stanza,
			'mode': getMode()
		});
		drawing = false;
	});

	var lastEmit = jQuery.now();

	doc.on('mousemove', function(e) {
		if (jQuery.now() - lastEmit > 30) {
			socket.emit('mousemove', {
				'x': e.pageX,
				'y': e.pageY,
				'drawing': drawing,
				'color': $('#minicolore').minicolors('rgbaString'),
				'id': me.id,
				'usernamerem': me.username,
				'sizepencil': document.getElementById('spessore').value,
				'room': stanza,
				'mode': getMode()
			});
			lastEmit = jQuery.now();
		}
		// Draw a line for the current user's movement, as it is
		// not received in the socket.on('moving') event above

		if (drawing) {
			if(getMode() == '1'){
				// Rectangle
				// Nope
			} else if(getMode() == '2'){
				// Ellipse
				// Nope
			} else {
				// Free style
				drawLine(prev.x, prev.y, e.pageX, e.pageY);
				prev.x = e.pageX;
				prev.y = e.pageY;
			}
		}
	});

	function getMode(){
		return document.getElementById('cubes').value;
	}
	
	function drawLine(fromx, fromy, tox, toy) {
		ctx.strokeStyle = $('#minicolore').minicolors('rgbaString');
		ctx.lineWidth = document.getElementById('spessore').value;
		ctx.beginPath();
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.stroke();
	}

	function drawLinerem(fromx, fromy, tox, toy, spessore, colorem) {
		ctx.strokeStyle = colorem;
		ctx.lineWidth = spessore;
		ctx.beginPath();
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.stroke();
	}

	function line(x1, y1, x2, y2, options){
		options = options || {}
		options.width = options.width || 1;
		options.color = options.color || 'black';
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.strokeStyle = options.color;
		ctx.lineWidth = options.width;
		ctx.stroke();
		ctx.closePath();
	}
	
	function draw_rect(x1, y1, x2, y2, options){
		line(x1, y1, x2, y1, options);
		draw_point(x2, y1, options.color, options.size);
		line(x2, y1, x2, y2, options);
		draw_point(x2, y2, options.color, options.size);
		line(x2, y2, x1, y2, options);
		draw_point(x1, y2, options.color, options.size);
		line(x1, y2, x1, y1, options);
		draw_point(x1, y1, options.color, options.size);
	}
	
	function drawEllipse(x1, y1, x2, y2, options) {
		options = options || {}
		options.width = options.width || 1;
		options.color = options.color || 'black';
		var radiusX = (x2 - x1) * 0.5,   /// radius for x based on input
			radiusY = (y2 - y1) * 0.5,   /// radius for y based on input
			centerX = x1 + radiusX,      /// calc center
			centerY = y1 + radiusY,
			step = 0.01,                 /// resolution of ellipse
			a = step,                    /// counter
			pi2 = Math.PI * 2 - step;    /// end angle

		ctx.beginPath();

		/// set start point at angle 0
		ctx.moveTo(centerX + radiusX * Math.cos(0),
				   centerY + radiusY * Math.sin(0));

		/// create the ellipse    
		for(; a < pi2; a += step) {
			ctx.lineTo(centerX + radiusX * Math.cos(a),
					   centerY + radiusY * Math.sin(a));
			}

		/// close it and stroke it for demo
		ctx.closePath();
		ctx.strokeStyle = options.color;
		ctx.lineWidth = options.width;
		ctx.stroke();
	}

	// put point 
	function draw_point(x, y, fill, size){
		fill = fill || 'black';
		size = size || 2;
		ctx.lineWidth = size * 2;
		if(drawing){
			ctx.lineTo(x, y);
		}
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(x, y, size, 0, 2 * Math.PI, false);
		ctx.fillStyle = fill;
		ctx.fill();
		ctx.beginPath();
		if(drawing) ctx.moveTo(x, y);
	}

	if(window.image){
		drawImage(window.image.url);
	}

	socket.emit('setuproom', {
		'room': stanza,
		'id': me.id,
		'usernamerem': me.username
	});
});