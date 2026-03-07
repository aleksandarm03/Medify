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

var findUserById=async function(userId)
{
    return await UserModel.findById(userId);
}

var updateUser=async function(userId, updateData)
{
    // Ne dozvoljavamo menjanje passworda kroz ovaj servis
    delete updateData.passwordHash;
    delete updateData.passwordSalt;
    delete updateData.password;
    
    updateData.updatedAt = new Date();
    return await UserModel.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    );
}

var deleteUser=async function(userId)
{
    return await UserModel.findByIdAndDelete(userId);
}

module.exports={
    register,
    findAllUsers,
    findUserById,
    updateUser,
    deleteUser
};