var express=require("express");
var router=express.Router({mergeParams: true});
var Campground=require("../models/campgrounds");
var Comment=require("../models/comments");
var middleware=require("../middleware");


router.get("/new",middleware.isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,campground){
		if(err)
			console.log(err);
		else
			res.render("comments/new",{campground:campground});
	});
	
});

router.post("/",middleware.isLoggedIn,function(req,res){
	Campground.findById(req.params.id,function(err,campground){
		if(err){
			console.log(err);
		    res.redirect("/campgrounds");}
		else
			Comment.create(req.body,function(err,comment){
				if(err)
					console.log(err);
				else
					comment.author.username=req.user.username;
				    comment.author.id=req.user._id;
					comment.save();
					campground.comments.push(comment);
				    campground.save();
				    req.flash("success","Comment successfully added");
				    res.redirect("/campgrounds/" + req.params.id);
			});
	});
});

router.get("/:comment_id/edit",middleware.checkCommentOwner,function(req,res){
	
	  Campground.findById(req.params.id,function(err,foundCampground){
		if(err || !foundCampground){
			req.flash("error","Campground not found");
			return res.render("back");
		}
		Comment.findById(req.params.comment_id,function(err,foundComment){
			if(err || !foundComment){
				req.flash("error","Comment not found");
				return res.render("back");
			}
			res.render("comments/edit",{campground:foundCampground,comment:foundComment});
		});
	});
});

router.put("/:comment_id",middleware.checkCommentOwner,function(req,res){
	Comment.findByIdAndUpdate(req.params.comment_id,req.body,function(err,updatedComment){
		if(err){
			res.render("back");
		}
		res.redirect("/campgrounds/" + req.params.id);
	});
});

router.delete("/:comment_id",middleware.checkCommentOwner,function(req,res){
	Campground.findById(req.params.id,function(err,foundCampground){
		if(err || !foundCampground){
			req.flash("error","Campground not found");
			return res.render("back");
		}
		Comment.findByIdAndRemove(req.params.comment_id,function(err){
			if(err){
				req.flash("error",err.message);
				return res.redirect("back");
			}
			req.flash("success","Comment deleted successfully");
			res.redirect("back");
		});
		
	});
});

module.exports= router;