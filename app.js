    require('dotenv').config();

var express   =require("express");
    bodyParser=require("body-parser");
    mongoose  =require("mongoose");
    Campground=require("./models/campgrounds");
    Comment   =require("./models/comments");
    passport  =require("passport");
    localStrategy=require("passport-local");
    passportLocalMongoose=require("passport-local-mongoose");
    User=require("./models/user");
    methodOverride=require("method-override");
    flash=require("connect-flash");
    commentRoutes=require("./routes/comments");
    campgroundRoutes=require("./routes/campgrounds");
    indexRoutes=require("./routes/index");
    

var app=express();
app.set("view engine","ejs");
app.use(express.static( __dirname + "/publish"));
app.use(methodOverride("_method"));
app.use(require("express-session")({
	secret: "Rusty is the best and cutest dog in the world",
	resave:false,
	saveUninitialized: false
}));
app.locals.moment=require("moment");
app.use(bodyParser.urlencoded({extended: true}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser=req.user;
	res.locals.error=req.flash("error");
	res.locals.success=req.flash("success");
	next();
});

app.use("/campgrounds/:id/comments",commentRoutes);
app.use("/campgrounds",campgroundRoutes);
app.use(indexRoutes);

mongoose.connect('mongodb+srv://Divyanshu:kmarQR5ciffqj0v4@cluster0.v2iew.mongodb.net/<dbname>?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
	.then(
	app.listen(process.env.PORT || 3000,"0.0.0.0",function(req,res){
	console.log("Server has started");
}))

