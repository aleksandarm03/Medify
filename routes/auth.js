const router=require('express').Router();
const userService=require('../services/userService');

const UserModel = require('../models/user');

router.get('/users',async (req,res)=>{

    res.send(await UserModel.find());
});


router.post('/register',async (req,res)=>{
    const user=await userService.register(req.body);      
    res.send(user);
   
});

module.exports=router;