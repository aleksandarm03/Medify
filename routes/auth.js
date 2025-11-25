const router=require('express').Router();
const userService=require('../services/userService');
const passport=require('../routes/config');

const UserModel = require('../models/user');

router.get('/users',async (req,res)=>{

    res.send(await UserModel.find());
});


router.post('/register',async (req,res)=>{
    var user=await userService.register(req.body);      
    res.send("User registered successfully!");

});


router.post("/login",
    passport.authenticate("local", {session:false}),
    async function(req, res){
    
    res.send(req.user.generateJwt())
})

module.exports=router;