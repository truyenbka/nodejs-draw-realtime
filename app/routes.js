module.exports = function(app, passport, mysql) {
	
	// render homepage
	app.get('/', function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// LOGIN ==============================
	app.get('/login', function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login'),
        function(req, res) {
            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }
        if(req.user.level == 1) {
        	res.redirect('/admin');
        } else {
        	res.redirect('/member');
        }
    });

	// SIGNUP ==============================
	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/member',
		failureRedirect : '/signup',
		failureFlash : true // allow flash messages
	}));

	// MEMBER SECTION =========================
	app.get('/member', isLoggedIn, function(req, res) {
		var query = 'SELECT image.id as id, image.url as url ' +
					' FROM (image INNER JOIN relationship ON image.id = relationship.id_img) ' +
					' WHERE relationship.id_user = ' + req.user.id;
		mysql.query(query, function(err, rows, fields) {
			if (err) throw err;
			res.render('member.ejs', {
				user : req.user,
				images: rows
			});
		});
	});

	// logout
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	

	app.get('/draw/:id_img', function(req, res) {
		var query = 'SELECT image.id as id, image.url as url ' +
					' FROM (image INNER JOIN relationship ON image.id = relationship.id_img)' +
					' WHERE relationship.id_user = ' + req.user.id +
					' AND image.id = ' + req.params.id_img;
		mysql.query(query, function(err, rows, fields) {
			if (err) throw err;
			if(rows.length > 0){
				res.render('draw.ejs', {
					user : req.user,
					images: [],
					image: rows[0]
				});
			} else {
				res.render('404.ejs');
			}
		});
	});

	app.post('/draw/:id_img', function(req, res) {
		var query = mysql.query('UPDATE image SET ? WHERE ?', [{ url: req.body.imgBase64 }, { id: req.params.id_img }] , function(err, result) {
			if (err) {
		      	console.log(err);
		    } else {
		     	console.log('-> Update database success !');
		    }
		});
	});


	app.get('/admin', isLoggedIn, function(req, res) {
		var query = 'SELECT * FROM image';
		mysql.query(query, function(err, rows, fields) {
			if (err) throw err;
			res.render('admin/main', {
				images: rows
			});
		});
	});

	app.get('/admin/artist', function(req, res) {
		var query = 'SELECT * FROM users';
		mysql.query(query, function(err, rows, fields) {
			if (err) throw err;
			res.render('admin/artist', {
				artist: rows
			});
		});
	});

	app.get('/admin/image', function(req, res) {
		var query = 'SELECT * FROM image';
		mysql.query(query, function(err, rows, fields) {
			if (err) throw err;
			res.render('admin/image', {
				images: rows
			});
		});
	});

	app.get('/admin/division', function(req, res) {
		var query = 'select relationship.id as idrel, image.id as idimg, url, username from users, relationship, image where users.id = relationship.id_user and image.id = relationship.id_img';
		mysql.query(query, function(err, rows, fields) {
			if (err) throw err;
			res.render('admin/division', {
				result: rows
			});
		});
	});

	app.get('/admin/division/add', function(req, res) {
		mysql.query('SELECT * FROM users WHERE id NOT LIKE "1";SELECT * FROM image', function(err, rows) {
			if (err) throw err;
			// console.log(rows[0]);
			// console.log(rows[1]);
			res.render('admin/division_add', {
				users: rows[0],
				images: rows[1]
			});
		});
	});

	app.post('/admin/division/add', function(req, res) {
		var data  = {id_user: req.body.idUser, id_img:req.body.idImg};
		mysql.query('INSERT INTO relationship SET ?', data, function(err, result) {
			if(err) throw err;
			res.redirect('/admin/division');
		});
	});

	app.get('/admin/division/delete/:id_rel', function(req, res) {
		mysql.query('DELETE FROM relationship WHERE id = ' + req.params.id_rel, function(err, result) {
			if (err) {
		      	console.log(err);
		    } else {
		     	res.redirect('/admin/division');
		    }
		});
	});

	app.get('/admin/image/fullsize', function(req, res) {
		mysql.query('SELECT * FROM image', function(err, result) {
			if (err) {
		      	console.log(err);
		    } else {
		     	res.render('admin/image_full', {
		     		img: result
		     	});
		    }
		});
	});



	// TEST CODE
	app.get('/test', function(req, res) {
		var query = mysql.query('SELECT * FROM image', function(err, result1) {
	     	for (var i in result1) {
	     		var query2 = mysql.query('SELECT id_user FROM relationship WHERE id_img = ' + result1[i]['id'], function(err, result2){
	     			console.log(result1[0]['id']);
	     			console.log(result2);
	     		});
	     		
	     	}
		});
	});


};



// route middleware to make sure
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();
	// if they aren't redirect them to the home page
	res.redirect('/');
}
