var express=require("express");
var router=express.Router();
var passport=require("passport");
var User=require("../models/user");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
const sgMail = require('@sendgrid/mail');
const middleware=require("../middleware");
var GoogleStrategy = require('passport-google-oauth20').Strategy;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.get("/",function(req,res){
	res.render("campgrounds/landingpage");
});

router.get("/register",function(req,res){
	res.render("register");
});

router.post("/register",async function(req,res){
	
	var newUser= new User(
		{
		username: req.body.username,
		email:req.body.email,
		emailToken:crypto.randomBytes(64).toString("hex"),
		isVerified:false	
		}
	)
	
	User.register(newUser,req.body.password,async function(err,user){
		if(err){
			req.flash("error",err.message);
			return res.redirect("/register"); 
		}
		const msg = {
         to: user.email,
         from: 'web.dev.supp.30@gmail.com', 
         subject: 'Yelpcamp Email Verification',
         text: `Hello There! Thanks for registering on our site .
                Please copy and paste the link below to verify your account.
                http://${req.headers.host}/verify-email?token=${user.emailToken}
                `,
         html: `<h1>Hello There!</h1>
               <p>Thanks for registering on our site .
                Please click below to verify your account.</p>
               <a href="http://${req.headers.host}/verify-email?token=${user.emailToken}">                  click here</a>
                `
        }
		try{
		await sgMail.send(msg);
		req.flash("success","Email has been sent to your email address for email verification");
		res.redirect("back");
		
	}catch(error){
		console.log(error);
		req.flash("error","Something went wrong.Please try again or contact us at                                        web.dev.supp.30@gmail.com");
		res.redirect("back");	
	};
});
});

router.get("/verify-email",async (req,res,next)=>{
	try{
		const user=await User.findOne({emailToken:req.query.token});
		if(!user){
			req.flash("error","Token is invalid.Please contact us at                                               web.dev.supp.30@gmail.com");
			return res.redirect("back");
		}
		user.emailToken=null;
		user.isVerified=true;	
		await user.save();
		await req.logIn(user,async (err)=>{
			if(err){
				return next(err);
			}	
			    req.flash("success",`Welcome to Yelpcamp ${user.username}`);
			    res.redirect("/campgrounds");
		});
	} catch(error){
		console.log(error);
		req.flash("error","Something went wrong");
		res.redirect("/campgrounds");
	}
});

router.get("/login",function(req,res){
	res.render("login");
});

router.post("/login",middleware.isVerified,passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
		failureFlash:true,
		successFlash:"Welcome back!"
    }), function(req, res){
});

router.get("/logout",function(req,res){
	req.logout();
	req.flash("success","Logged out successfully!");
	res.redirect("/campgrounds");
});

router.get("/forgot",function(req,res){
	res.render("forgot");
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'web.dev.supp.30@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'web.dev.supp.30@gmail.com',
        subject: 'Yelpcamp Account Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'web.dev.supp.30@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'web.dev.supp.30@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
	  res.redirect('/campgrounds');
  });
});

// router.get("/contact",(req,res)=>{
// 	res.render("contact");
// });

// router.post("/contact",async (req,res)=>{
// 	const msg = {
//   to: 'divyanshuparwal2001@gmail.com',
//   from: req.body.email, 
//   subject: 'Yelpcamp Contact Form',
//   text: req.body.message,
//   html: `<strong>${req.body.message}</strong>`
// }
     
// 	try{
// 		await sgMail.send(msg);
// 		req.flash("success","Thank you for your email,we will get back to you shortly");
// 		res.redirect("back");
		
// 	}catch(error){
// 		console.error(error);
// 		if(error.response){
// 			console.error(error.response.body);
// 		}
// 		req.flash("error","Something went wrong");
// 		res.redirect("back");
// }
	
// });


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACKURL
  }, function(accessToken, refreshToken, profile, done) {
       User.findOrCreate({ 
		   google:{id: profile.id},
		   username:profile.displayName,
		   email:profile.emails[0].value,
		   emailToken:null,
		   isVerified:profile.emails[0].verified
	   }, function (err, user) {
		   return done(err, user);
       });
  }
));
	passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

router.get('/auth/google',
  passport.authenticate('google',{ scope:['https://www.googleapis.com/auth/userinfo.email' 
     ,'https://www.googleapis.com/auth/userinfo.profile' ] }),function(req,res){
	if(err)
		console.log(err);
});


router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    req.flash("success",`Welcome to Yelpcamp ${req.user.username}`);
	res.redirect('/campgrounds');
  });


module.exports= router;