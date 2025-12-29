const MedicalRecordModel = require("../models/medicalRecord");

var createMedicalRecord = async function(body, doctor, patient, appointment) {
    const medicalRecord = new MedicalRecordModel({
        patient: patient._id,
        doctor: doctor._id,
        appointment: appointment ? appointment._id : null,
        visitDate: body.visitDate || new Date(),
        diagnosis: body.diagnosis,
        symptoms: body.symptoms || [],
        examinationNotes: body.examinationNotes,
        treatment: body.treatment,
        recommendations: body.recommendations,
        vitalSigns: body.vitalSigns || {},
        labResults: body.labResults || [],
        followUpDate: body.followUpDate
    });
    
    return await medicalRecord.save();
};

var getMedicalRecordsByPatient = async function(patientId) {
    return await MedicalRecordModel.find({ patient: patientId })
        .populate("doctor", "firstName lastName specialization")
        .populate("appointment")
        .sort({ visitDate: -1 });
};

var getMedicalRecordById = async function(recordId) {
    return await MedicalRecordModel.findById(recordId)
        .populate("patient", "firstName lastName JMBG dateOfBirth bloodType allergies")
        .populate("doctor", "firstName lastName specialization")
        .populate("appointment");
};

var updateMedicalRecord = async function(recordId, body) {
    body.updatedAt = new Date();
    return await MedicalRecordModel.findByIdAndUpdate(
        recordId,
        { $set: body },
        { new: true, runValidators: true }
    ).populate("patient", "firstName lastName")
     .populate("doctor", "firstName lastName specialization");
};

var addLabResult = async function(recordId, labResult) {
    return await MedicalRecordModel.findByIdAndUpdate(
        recordId,
        { $push: { labResults: labResult } },
        { new: true }
    );
};

module.exports = {
    createMedicalRecord,
    getMedicalRecordsByPatient,
    getMedicalRecordById,
    updateMedicalRecord,
    addLabResult
};

