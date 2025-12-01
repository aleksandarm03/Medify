const UserModel=require('../models/user');

var register=async function(body)
{
    var user=await UserModel.register(body.JMBG,body.firstName,body.lastName,body.password,body.homeAddress,body.phoneNumber,body.gender,body.role);  
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