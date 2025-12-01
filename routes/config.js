const passport = require("passport")
const UserModel = require("../models/user")
var LocalStrategy = require("passport-local").Strategy
var passportJWT=require("passport-jwt")
const config = require("../config")

var localOptions = {
    usernameField: "JMBG"
}

passport.use(new LocalStrategy(localOptions, async function(JMBG, password, done){
    var user = await UserModel.findOne({JMBG:JMBG})
    if (!user)
    {
        done(null, null, {message:"Credentials not valid!"})
    }
    else
    {
        var success = user.validatePassword(password)
        if (success)
        {
            done(null, user)
        }
        else
        {
            done(null, null, {message:"Credentials not valid!"})
        }
    }
}))


var JWTOptions = {
    secretOrKey: config.secret,
    jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()
}

passport.use(new passportJWT.Strategy(JWTOptions,async function (payload,done) {
    var user=await UserModel.findById(payload._id)
    if(!user)
    {
        done(null, null, {message:"Token not valid!"})
    }
    else 
        done(null,user);

}))



passport.authorizeAdmin=()=>(req,res,next)=>{
    if(req.user.role==="admin")
        next()
    else res.status(403).send({message:"Forbidden"});
}

module.exports = passport