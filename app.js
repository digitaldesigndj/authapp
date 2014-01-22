var APPLICATION_PORT = process.env.PORT||3000;
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
var GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL||'http://hyprtxt.com/auth/google/callback';

// Create Server and Express Application
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app).listen(APPLICATION_PORT);
// var util = require('util');

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

// app.use(express.static(__dirname + '/public'));

app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({ secret: 'keyboard cat likes keyboard warmth' }));


// Add our Application Middlewares
app.use(app.router);

// Add DocPad to our Application
var docpadInstanceConfiguration = {
    // Give it our express application and http server
    serverExpress: app,
    serverHttp: server,

    // Tell it not to load the standard middlewares (as we handled that above)
    middlewareStandard: false
};
var docpadInstance = require('docpad').createInstance(docpadInstanceConfiguration, function(err){
    if (err)  return console.log(err.stack);

    // Tell DocPad to perform a generation, extend our server with its routes, and watch for changes
    docpadInstance.action('generate server watch', function(err){
        if (err)  return console.log(err.stack);
    });
});



// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

app.get('/alias', function(req, res, next) {
  req.templateData = {
    weDidSomeCustomRendering: true
  };
  var document = docpadInstance.getFile({
    relativePath: 'index.html.md'
  });
  console.log( document );
  return docpadInstance.serveDocument({
    'document': document,
    'req': req,
    'res': res,
    'next': next
  });
});

app.get('/root', function(req, res, next) { res.send('i has the root'); });

// @todo - replace with docpad stuff. OR NOT

app.get('/', function(req, res){
  res.render('index', { user: req.user, title: 'Hyprtxt'});
});

// app.get('/account', ensureAuthenticated, function(req, res){
//   res.render('account', { user: req.user });
// });

app.get('/login', function(req, res){
  res.redirect('/auth/google');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
  passport.authenticate('google', { scope: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ] }),
  function(req, res){
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
  });

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}
