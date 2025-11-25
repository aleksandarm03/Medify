const UserModel=require('../models/user');

var register=function(body)
{
    var user=UserModel.register(body.JMBG,body.firstName,body.lastName,body.password,body.homeAddress,body.phoneNumber,body.gender,body.role);    
    return user;
}


module.exports={register};