jQuery(function() {
	var url = window.location.hostname;
	var stanza = '';
	if (location.href.indexOf('#') != -1) {
		stanza = location.href.substring(location.href.indexOf('#') + 1);
	}

	var positionx = '23';
	var positiony = '0';

	var doc = jQuery(document),
		canvas = jQuery('#paper'),
		instructions = jQuery('#instructions');
	var color = '#000000';
	
	var drawing = false;
	var clients = {};
	var cursors = {};

	var username = '';

	username = username.substr(0, 20);
	var socket = io.connect(url);

	var ctx = canvas[0].getContext('2d');
	var spessore = jQuery('#spessore').value;
	var colorem;
	// Force canvas to dynamically change its size to the same width/height
	// as the browser window.
	canvas[0].width = document.body.clientWidth;
	canvas[0].height = document.body.clientHeight;

	// ctx setup
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.lineWidth = 2;

	// Generate an unique ID
	var id = Math.round(jQuery.now() * Math.random());
	if (username == '') {
		username = id
	}

	socket.emit('setuproom', {
		'room': stanza,
		'id': id,
		'usernamerem': username
	});

	socket.on('setuproomser', function(data) {
		stanza = data.room;
		jQuery('<div class="testochatser"><span>SERVER:</span> ' + data.inforoom + data.listautenti + '</div>').appendTo('#testichat');
		document.getElementById('frecce').style.backgroundColor = '#ffff00';
	});


	jQuery('#scrivi').keypress(function(e) {
		var code = e.keyCode;
		if (code == '13') {
				socket.emit('chat', {
					'testochat': document.getElementById('scrivi').value,
					'id': id,
					'usernamerem': username,
					'room': stanza
				});
				jQuery('<div class="testochat"><span>ME:</span> ' + document.getElementById('scrivi').value + '</div>').appendTo('#testichat');
				document.getElementById('scrivi').value = '';

				var objDiv = document.getElementById("testichat");
				objDiv.scrollTop = objDiv.scrollHeight;
		}
	});

	
	// save image to database
	jQuery('#salvafoto').click(function() {
		var dataURL = canvas[0].toDataURL();
		document.getElementById("canvasimg").src = dataURL;
		window.open(document.getElementById("canvasimg").src, "toDataURL() image", "width=1000, height=1000");
	});

	// clear board
	jQuery('#cancellalavagna').click(function() {
		ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
	});

	socket.on('chatser', function(data) {
		jQuery('<div class="testochat"><span>' + data.usernamerem + ':</span> ' + data.testochat + '</div>').appendTo('#testichat');
		var objDiv1 = document.getElementById("testichat");
		objDiv1.scrollTop = objDiv1.scrollHeight;
	});

	socket.on('listautentiser', function(data) {
		jQuery('<div class="testochatser"><span>SERVER:</span> ' + data.listautenti + '</div>').appendTo('#testichat');
	});

	socket.on('moving', function(data) {
		if (!(data.id in clients)) {
			cursors[data.id] = jQuery('<div class="cursor"><div class="identif">' + data.usernamerem + '</div>').appendTo('#cursors');
		}
		cursors[data.id].css({
			'left': data.x,
			'top': data.y
		});
		// Is the user drawing?
		if (data.drawing && clients[data.id]) {
			// Draw a line on the canvas. clients[data.id] holds
			// the previous position of this user's mouse pointer
			ctx.strokeStyle = data.color;
			drawLinerem(clients[data.id].x, clients[data.id].y, data.x, data.y, data.spessremo, data.color);
		}
		// Saving the current client state
		clients[data.id] = data;
		clients[data.id].updated = jQuery.now();
	});

	var prev = {};

	canvas.on('mousedown', function(e) {
		e.preventDefault();
		drawing = true;
		prev.x = e.pageX;
		prev.y = e.pageY;
		instructions.fadeOut();
	});

	doc.bind('mouseup mouseleave', function() {
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
				'id': id,
				'usernamerem': username,
				'spessremo': document.getElementById('spessore').value,
				'room': stanza
			});
			lastEmit = jQuery.now();
		}
		// Draw a line for the current user's movement, as it is
		// not received in the socket.on('moving') event above

		if (drawing) {
			drawLine(prev.x, prev.y, e.pageX, e.pageY);
			prev.x = e.pageX;
			prev.y = e.pageY;
		}
	});

	
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

});