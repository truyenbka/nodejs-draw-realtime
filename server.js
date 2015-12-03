// server.js

var http = require('http');
var express  = require('express');
var session  = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var app      = express();
var server = http.createServer(app);
var mysql = require('./config/mysql');
var io = require('socket.io').listen(server,  {
	log:false,
	origins:'*:*',
	serveClient: true,
	transports: ["websocket","polling"]
});	
var port     = process.env.PORT || 8080;

var passport = require('passport');
var flash    = require('connect-flash');

// connect to passport
require('./config/passport')(passport);
// COnnect to mysqldb
mysql.connect();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});	

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
	secret: 'vidyapathaisalwaysrunning',
	resave: true,
	saveUninitialized: true
 } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session



app.use(express.static('views/assets'));


// routes ======================================================================
require('./app/routes.js')(app, passport, mysql); // load our routes and pass in our app and fully configured passport
require('./app/realtime.js')(app, io);

// launch ======================================================================
server.listen(port);
console.log('The web server on port ' + port);








