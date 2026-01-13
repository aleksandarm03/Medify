const PrescriptionModel = require("../models/prescription");

var createPrescription = async function(body, doctor, patient, medicalRecord, appointment) {
    const prescription = new PrescriptionModel({
        patient: patient._id,
        doctor: doctor._id,
        medicalRecord: medicalRecord ? medicalRecord._id : null,
        appointment: appointment ? appointment._id : null,
        medications: body.medications,
        issueDate: body.issueDate || new Date(),
        validUntil: body.validUntil,
        notes: body.notes,
        status: "active"
    });
    
    return await prescription.save();
};

var getPrescriptionsByPatient = async function(patientId, status = null) {
    const query = { patient: patientId };
    if (status) {
        query.status = status;
    }
    
    return await PrescriptionModel.find(query)
        .populate("doctor", "firstName lastName specialization")
        .populate("medicalRecord")
        .populate("appointment")
        .sort({ issueDate: -1 });
};

var getPrescriptionById = async function(prescriptionId) {
    return await PrescriptionModel.findById(prescriptionId)
        .populate("patient", "firstName lastName JMBG allergies")
        .populate("doctor", "firstName lastName specialization licenseNumber")
        .populate("medicalRecord")
        .populate("appointment");
};

var updatePrescriptionStatus = async function(prescriptionId, status) {
    return await PrescriptionModel.findByIdAndUpdate(
        prescriptionId,
        { 
            $set: { 
                status: status,
                updatedAt: new Date()
            }
        },
        { new: true }
    );
};

var getActivePrescriptions = async function(patientId) {
    return await PrescriptionModel.find({ 
        patient: patientId,
        status: "active",
        $or: [
            { validUntil: { $gte: new Date() } },
            { validUntil: null }
        ]
    })
    .populate("doctor", "firstName lastName")
    .sort({ issueDate: -1 });
};

module.exports = {
    createPrescription,
    getPrescriptionsByPatient,
    getPrescriptionById,
    updatePrescriptionStatus,
    getActivePrescriptions
};


