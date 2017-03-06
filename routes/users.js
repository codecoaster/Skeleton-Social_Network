
//add csrf protection requirements for forms
var cookieParser = require('cookie-parser');  
var csrf = require('csurf');  
var csrfProtection = csrf({ cookie: true });  
var bodyParser = require('body-parser');  

//start user management and routing requirements
var express = require('express');
var passport = require("passport");
//load our model inside the route file
var User = require("../models/users");

//load routing libraries from express framework
var router = express.Router();


// we need this because "cookie" is true in csrfProtection 
router.use(cookieParser());


// Sets useful variables for your templates
router.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.errors = req.flash("error");
  res.locals.infos = req.flash("info");
  next();
});


/* GET users listing. */
// queries the users collection, returning the newest users first
router.get("/", function(req, res, next) {
  User.find()
  .sort({ createdAt: "descending" })
  .exec(function(err, users) {
    if (err) { return next(err); }
    res.render("index", { users: users });
  });
});


//adding sign-up routes


router.get("/signup", csrfProtection, function(req, res) {
  res.render("signup", { csrfToken: req.csrfToken() });
});


//body-parser adds the username and password to req.body
router.post("/signup", function(req, res, next){
  var username = req.body.username;
  var password = req.body.password;

//call findOne to return just one user. We want a match on usernames here
  User.findOne({ username:username}, function(err, user){
    if(err){ return next(err); //passe vers la création du newUser
    }
    if(user){
      //if you find a user, you should bail out because that username already exist 
      req.flash("error", "User already exist");
      return res.redirect("/signup");
    }

    //else create a new instance of the user model and continues to the next request handler
    var newUser = new User({
      username: username,
      password: password
    });
    //saves the user to the database and continues to the next request handler
    newUser.save(next);
});
//authenticate the user
}, passport.authenticate("login", {
  successRedirect: "/",
  failureRedirect: "/signup",
  failureFlash: true
 }));

//profile router
router.get("/users/:username", function(req, res, next) {
  User.findOne({ username: req.params.username }, function(err, user) {
    if (err) { return next(err); }
    if (!user) { return next(404); }
    res.render("profile", { user: user });
  });
});

//login router - will simply render the login view with the login form
router.get("/login", function(req, res){
  res.render("login");
});

//login form action
router.post("/login", passport.authenticate("login", {
  successRedirect: "/",
  failureRedirect: "/login",
  failureFlash: true
}));

module.exports = router;
