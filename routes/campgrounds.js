var express=require("express");
var router=express.Router();
var Campground=require("../models/campgrounds");
var middleware=require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'divyanshuparwal', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.get("/",function(req,res){
	Campground.find({},function(err,campgrounds){
		if (err)
		console.log(err);
	    else
		res.render("campgrounds/index",{campgrounds:campgrounds,currentUser:req.user});
	});
	
});


router.get("/new",middleware.isLoggedIn,function(req,res){
	res.render("campgrounds/new")
});

router.post("/",middleware.isLoggedIn,upload.single('image'),function(req,res){
   
	cloudinary.v2.uploader.upload(req.file.path,{ moderation: "webpurify" }, function(err,result) {
  // add cloudinary url for the image to the request object under image property
     if(err){
		 console.log(err);
		 return res.redirect("back");
		 
	 }
		req.body.image = result.secure_url;
		req.body.imageId=result.public_id;
  // add author to body object
  req.body.author = {
    id: req.user._id,
    username: req.user.username
  }
  Campground.create(req.body, function(err, campground) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    res.redirect('/campgrounds/' + campground.id);
  });
});
	 });

router.get("/:id",function(req,res){
		Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
		if(err || !foundCampground){
			req.flash("error","Campground not found");
			res.redirect("/campgrounds");
		}
		else
			
			res.render("campgrounds/show",{campground:foundCampground});	
	});
	
});

router.get("/:id/edit",middleware.checkCampgroundOwner,function(req,res){
	Campground.findById(req.params.id,function(err,foundCampground){
		if(err){
			console.log(err);
		    res.redirect("back");}
		else
		res.render("campgrounds/edit",{campground:foundCampground});
		    
	});
});

router.put("/:id",middleware.checkCampgroundOwner,upload.single('image'),function(req,res){
	Campground.findById(req.params.id,async function(err,foundCampground){
		if(err){
			req.flash("error",err.message);
			res.redirect("back");
		}
		else {
			if(req.file){
			try {
			await cloudinary.v2.uploader.destroy(foundCampground.imageId);
			var result=await cloudinary.v2.uploader.upload(req.file.path,{ moderation: "webpurify" });
				foundCampground.imageId=result.public_id;
				foundCampground.image=result.secure_url;
				}
				
			catch(err){
			req.flash("error",err.message);
			res.redirect("back");
			}	
				}
		      foundCampground.name=req.body.name;
			  foundCampground.description=req.body.description;
		      foundCampground.price=req.body.price;
			  foundCampground.save();
			req.flash("success","Campground updated successfully");
			res.redirect("/campgrounds/" + req.params.id);
		}
			
	});
});
	

router.delete("/:id",middleware.checkCampgroundOwner,function(req,res){
	Campground.findById(req.params.id,async function(err,foundCampground){
		if(err){
			req.flash("error",err.message);
			res.redirect("back");
		}
		else {
		    try{
				await cloudinary.v2.uploader.destroy(foundCampground.imageId);
				foundCampground.remove();
				req.flash("success","Campground deleted successfully");
				res.redirect("/campgrounds");
			}
			catch(err){
				 
			req.flash("error",err.message);
			res.redirect("back");
		}
			}
		});
	
	
});






module.exports= router;