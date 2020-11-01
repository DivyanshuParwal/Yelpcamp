var mongoose=require("mongoose");
    passportLocalMongoose=require("passport-local-mongoose");
    findOrCreate = require('mongoose-findorcreate')

var userSchema = new mongoose.Schema({
	username:{type:String,unique:true,required:true},
	password:String,
	email:{type:String,required:true,unique:true},
	resetPasswordToken:String,
	resetPasswordExpires:Date,
	emailToken:String,
	isVerified:Boolean,
	google:{ 
		id:String
	}
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
module.exports= mongoose.model("User",userSchema);