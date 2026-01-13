const passport = require("passport")
const UserModel = require("../models/user")
var LocalStrategy = require("passport-local").Strategy
var passportJWT=require("passport-jwt")
const config = require("../config")

var localOptions = {
    usernameField: "JMBG"
}

passport.use(new LocalStrategy(localOptions, async function(JMBG, password, done){
    try {
        var user = await UserModel.findOne({JMBG:JMBG})
        if (!user)
        {
            return done(null, null, {message:"Credentials not valid!"})
        }
        else
        {
            var success = user.validatePassword(password)
            if (success)
            {
                return done(null, user)
            }
            else
            {
                return done(null, null, {message:"Credentials not valid!"})
            }
        }
    } catch (error) {
        return done(error, null)
    }
}))


var JWTOptions = {
    secretOrKey: config.secret,
    jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()
}

passport.use(new passportJWT.Strategy(JWTOptions,async function (payload,done) {
    try {
        var user=await UserModel.findById(payload._id)
        if(!user)
        {
            return done(null, null, {message:"Token not valid!"})
        }
        else 
            return done(null,user);
    } catch (error) {
        return done(error, null)
    }
}))



passport.authorizeRoles=(...roles)=>(req,res,next)=>{
    if(req.user &&  roles.indexOf(req.user.role)!=-1)
        next()
    else res.status(403).send({message:"Forbidden"});
}

module.exports = passport