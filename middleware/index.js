var middlewareObj ={};
var Campground=require("../models/campgrounds");
var Comment=require("../models/comments");
var User=require("../models/user");


middlewareObj.checkCampgroundOwner = function checkCampgroundOwner(req,res,next){
	if (req.isAuthenticated()){
		Campground.findById(req.params.id,function(err,foundCampground){
			if(err || !foundCampground)
			{ req.flash("error","Campground not found");
			  res.redirect("back");
			}		
			else
			{if(foundCampground.author.id.equals(req.user._id))
				next();
			else
			{req.flash("error","You don't have permission to do that");
				res.redirect("back");
			}
			}
		});
	}
	else
	{req.flash("error","You need to be logged in to do that");
		res.redirect("back");}
}

middlewareObj.checkCommentOwner = function checkCommentOwner(req,res,next){
	if (req.isAuthenticated()){
		Campground.findById(req.params.id,function(err,foundCampground){
		if(err || !foundCampground){
			req.flash("error","Campground not found");
			return res.render("back");
		}
		  Comment.findById(req.params.comment_id,function(err,foundComment){
			if(err || !foundComment)
			{ req.flash("error","Comment not found");
			  res.redirect("back");
			}		
			else
			{if(foundComment.author.id.equals(req.user._id))
				next();
			else
			{   req.flash("error","You don't have permission to do that");
				res.redirect("back");
			}
			}
		});
	});
  }
	else
	{req.flash("error","You need to be logged in to do that");
		res.redirect("back");}
}

middlewareObj.isVerified= async function(req,res,next){
	try{
		const user= await User.findOne({username:req.body.username});
		if(user.isVerified){
		return next();
	}
	req.flash("error","You email must be verified to Login");
	res.redirect("back");
}   catch(error){
	req.flash("error",error.message);
	res.redirect("back");
   }
}

middlewareObj.isLoggedIn =function(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error","You need to be logged in to do that");
	res.redirect("/login");
}

module.exports = middlewareObj;