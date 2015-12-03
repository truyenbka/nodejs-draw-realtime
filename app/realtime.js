module.exports = function(app, io) {
	io.set('origins', '*:*');
	io.set('log level', 1);

	io.sockets.on('connection', function(socket) {
		socket.join('public');
		socket.on('disconnect', function() {
			console.log('-> Anyone is disconnected');
		});

		socket.on('setuproom', function(data) {
			socket.join(data.room, function(){
				socket.nickname = data.usernamerem;
				var roster = io.sockets.clients(data.room);
				var listautenti = '';
				
				roster.forEach(function(client) {
					listautenti = listautenti + client.nickname + '<br />';
				});

				listautenti = 'LIST USERS: ' + listautenti;
				io.sockets.in(data.room).emit('setuproomser', {
					'room': data.room,
					'inforoom': '',
					'listautenti': listautenti,
					'id': data.id
				});

				io.sockets.in(data.room).emit('listautentiser', {
					'listautenti': listautenti
				});

				socket.on('mouseup', function(data) {	
					socket.broadcast.to(data.room).emit('up', data);
				});

				socket.on('mousedown', function(data) {	
					socket.broadcast.to(data.room).emit('down', data);
				});

				socket.on('mousemove', function(data) {	
					socket.broadcast.to(data.room).emit('moving', data);
				});

				socket.on('working', function(data) {	
					socket.broadcast.to(data.room).emit('working', data);
				});

				socket.on('chat', function(data) {
					socket.broadcast.to(data.room).emit('chatser', data);
				});
			});
		});
	});
}