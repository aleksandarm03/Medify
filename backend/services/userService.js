const UserModel=require('../models/user');

var register=async function(body)
{
    var user=await UserModel.register(body);  
    console.log(user)  
    return user;
}

var findAllUsers=function()
{
    return UserModel.find();
}

module.exports={
    register,
    findAllUsers
};