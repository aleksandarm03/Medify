const mongoose = require("mongoose")

var AppointmentSchema=mongoose.Schema({
    doctor:{type:mongoose.Types.ObjectId,ref:"User",required:true},
    patient:{type:mongoose.Types.ObjectId,ref:"User",required:true},
    appointmentDate:{type:Date,required:true},
    reason:{type:String,required:true},
    status:{type:String,enum:["scheduled","completed","canceled"],default:"scheduled"},
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
})

var AppointmentModel=mongoose.model("Appointment",AppointmentSchema);
AppointmentModel.makeAppointment=async function(doctor,patient,appointmentDate,reason) {
    var appointment=new AppointmentModel({
        doctor:doctor._id,
        patient:patient._id,
        appointmentDate:appointmentDate,
        reason:reason
    })

    
    doctor.appointments.push(appointment._id);
    patient.appointments.push(appointment._id);
    await doctor.save();
    await patient.save();   
    return await appointment.save();
}

module.exports=AppointmentModel;