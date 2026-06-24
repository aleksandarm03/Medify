const MedicalRecordModel = require("../models/medicalRecord");

function buildPatientSnapshot(patient) {
    if (!patient) {
        return {
            patientId: null,
            firstName: "",
            lastName: "",
            JMBG: ""
        };
    }

    return {
        patientId: patient._id || null,
        firstName: patient.firstName || "",
        lastName: patient.lastName || "",
        JMBG: patient.JMBG || ""
    };
}

function buildDoctorSnapshot(doctor) {
    if (!doctor) {
        return {
            doctorId: null,
            firstName: "",
            lastName: "",
            specialization: ""
        };
    }

    return {
        doctorId: doctor._id || null,
        firstName: doctor.firstName || "",
        lastName: doctor.lastName || "",
        specialization: doctor.specialization || ""
    };
}

var createMedicalRecord = async function(body, doctor, patient, appointment) {
    const medicalRecord = new MedicalRecordModel({
        patient: patient._id,
        patientSnapshot: buildPatientSnapshot(patient),
        doctor: doctor._id,
        doctorSnapshot: buildDoctorSnapshot(doctor),
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
    
    const saved = await medicalRecord.save();
    return await MedicalRecordModel.findById(saved._id)
        .populate("patient", "firstName lastName JMBG")
        .populate("doctor", "firstName lastName specialization")
        .populate("appointment");
};

var getMedicalRecordsByPatient = async function(patientId) {
    return await MedicalRecordModel.find({ patient: patientId })
        .populate("patient", "firstName lastName JMBG")
        .populate("doctor", "firstName lastName specialization")
        .populate("appointment")
        .sort({ visitDate: -1 });
};

var getMedicalRecordsByDoctor = async function(doctorId) {
    return await MedicalRecordModel.find({ doctor: doctorId })
        .populate("patient", "firstName lastName JMBG")
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
    ).populate("patient", "firstName lastName JMBG")
     .populate("doctor", "firstName lastName specialization")
     .populate("appointment");
};

var deleteMedicalRecord = async function(recordId) {
    return await MedicalRecordModel.findByIdAndDelete(recordId);
};

var getAllMedicalRecords = async function() {
    return await MedicalRecordModel.find()
        .populate("patient", "firstName lastName JMBG")
        .populate("doctor", "firstName lastName specialization")
        .populate("appointment")
        .sort({ visitDate: -1 });
};

var nullifyPatientInMedicalRecords = async function(patientId) {
    const medicalRecords = await MedicalRecordModel.find({ patient: patientId }).select('_id');
    
    if (medicalRecords.length === 0) {
        return { updatedCount: 0, recordIds: [] };
    }
    
    const recordIds = medicalRecords.map(record => record._id);
    const updateResult = await MedicalRecordModel.updateMany(
        { _id: { $in: recordIds } },
        { 
            $set: { 
                patient: null,
                updatedAt: new Date()
            }
        }
    );
    
    return {
        updatedCount: updateResult.modifiedCount || 0,
        recordIds
    };
};

var stampPatientSnapshotInMedicalRecords = async function(patient) {
    if (!patient || !patient._id) {
        return { updatedCount: 0, recordIds: [] };
    }

    const medicalRecords = await MedicalRecordModel.find({ patient: patient._id }).select('_id');

    if (medicalRecords.length === 0) {
        return { updatedCount: 0, recordIds: [] };
    }

    const recordIds = medicalRecords.map(record => record._id);
    const updateResult = await MedicalRecordModel.updateMany(
        { _id: { $in: recordIds } },
        {
            $set: {
                patientSnapshot: buildPatientSnapshot(patient),
                updatedAt: new Date()
            }
        }
    );

    return {
        updatedCount: updateResult.modifiedCount || 0,
        recordIds
    };
};

var stampDoctorSnapshotInMedicalRecords = async function(doctor) {
    if (!doctor || !doctor._id) {
        return { updatedCount: 0, recordIds: [] };
    }

    const medicalRecords = await MedicalRecordModel.find({ doctor: doctor._id }).select('_id');

    if (medicalRecords.length === 0) {
        return { updatedCount: 0, recordIds: [] };
    }

    const recordIds = medicalRecords.map(record => record._id);
    const updateResult = await MedicalRecordModel.updateMany(
        { _id: { $in: recordIds } },
        {
            $set: {
                doctorSnapshot: buildDoctorSnapshot(doctor),
                updatedAt: new Date()
            }
        }
    );

    return {
        updatedCount: updateResult.modifiedCount || 0,
        recordIds
    };
};

module.exports = {
    createMedicalRecord,
    getMedicalRecordsByPatient,
    getMedicalRecordsByDoctor,
    getMedicalRecordById,
    updateMedicalRecord,
    addLabResult,
    deleteMedicalRecord,
    getAllMedicalRecords,
    nullifyPatientInMedicalRecords,
    stampPatientSnapshotInMedicalRecords,
    stampDoctorSnapshotInMedicalRecords
};


