const router=require('express').Router();
const userService=require('../services/userService');
const passport=require('../routes/config');
const UserModel = require('../models/user');


router.post('/register',async (req,res)=>{
    var user=await userService.register(req.body);      
       if (user) {
            return res.status(201).send(user);
        } else {
            return res.status(400).send("Registration failed.");
        }
});


router.post("/login",
    passport.authenticate("local", {session:false}),
    async function(req, res){
    res.send(req.user.generateJwt())
})

router.get('/users', passport.authenticate("jwt",{session:false}),
passport.authorizeRoles("admin"),
    async function (req,res) {
        var users=await userService.findAllUsers()
        res.send(users);
    }
)


module.exports=router;