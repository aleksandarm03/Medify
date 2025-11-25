const passport = require("passport")
const UserModel = require("../models/user")
var LocalStrategy = require("passport-local").Strategy

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

module.exports = passport