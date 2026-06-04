const PrescriptionModel = require("../models/prescription");

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

var createPrescription = async function(body, doctor, patient, medicalRecord, appointment) {
    const prescription = new PrescriptionModel({
        patient: patient._id,
        patientSnapshot: buildPatientSnapshot(patient),
        doctor: doctor._id,
        doctorSnapshot: buildDoctorSnapshot(doctor),
        medicalRecord: medicalRecord ? medicalRecord._id : null,
        appointment: appointment ? appointment._id : null,
        medications: body.medications.map((med) => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions || "",
            status: "active"
        })),
        issueDate: body.issueDate || new Date(),
        validUntil: body.validUntil,
        notes: body.notes,
        status: "active"
    });
    
    const saved = await prescription.save();
    return await getPrescriptionById(saved._id);
};

var getPrescriptionsByPatient = async function(patientId, status = null) {
    const query = { patient: patientId };
    if (status && status.trim() !== "") {
        query.status = status;
    }
    
    return await PrescriptionModel.find(query)
        .populate("patient", "firstName lastName")
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
    const updated = await PrescriptionModel.findByIdAndUpdate(
        prescriptionId,
        {
            $set: {
                status: status,
                updatedAt: new Date()
            }
        },
        { new: true }
    );

    if (!updated) {
        return null;
    }

    return await getPrescriptionById(prescriptionId);
};

var addMedicationToPrescription = async function(prescriptionId, medication) {
    const prescription = await PrescriptionModel.findById(prescriptionId);

    if (!prescription) {
        return null;
    }

    if (prescription.status !== "active") {
        const error = new Error("PRESCRIPTION_NOT_ACTIVE");
        error.code = "PRESCRIPTION_NOT_ACTIVE";
        throw error;
    }

    if (!medication || !medication.name || !medication.dosage || !medication.frequency || !medication.duration) {
        const error = new Error("INVALID_MEDICATION");
        error.code = "INVALID_MEDICATION";
        throw error;
    }

    prescription.medications.push({
        name: medication.name.trim(),
        dosage: medication.dosage.trim(),
        frequency: medication.frequency.trim(),
        duration: medication.duration.trim(),
        instructions: medication.instructions ? medication.instructions.trim() : "",
        status: "active"
    });
    prescription.updatedAt = new Date();
    await prescription.save();

    return await getPrescriptionById(prescriptionId);
};

var cancelMedicationInPrescription = async function(prescriptionId, medicationId) {
    const prescription = await PrescriptionModel.findById(prescriptionId);

    if (!prescription) {
        return null;
    }

    if (prescription.status !== "active") {
        const error = new Error("PRESCRIPTION_NOT_ACTIVE");
        error.code = "PRESCRIPTION_NOT_ACTIVE";
        throw error;
    }

    const medication = prescription.medications.id(medicationId);

    if (!medication) {
        const error = new Error("MEDICATION_NOT_FOUND");
        error.code = "MEDICATION_NOT_FOUND";
        throw error;
    }

    if (medication.status === "cancelled") {
        const error = new Error("MEDICATION_ALREADY_CANCELLED");
        error.code = "MEDICATION_ALREADY_CANCELLED";
        throw error;
    }

    medication.status = "cancelled";
    prescription.updatedAt = new Date();
    await prescription.save();

    return await getPrescriptionById(prescriptionId);
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
    .populate("patient", "firstName lastName")
    .populate("doctor", "firstName lastName")
    .sort({ issueDate: -1 });
};

var deletePrescription = async function(prescriptionId) {
    return await PrescriptionModel.findByIdAndDelete(prescriptionId);
};

var getAllPrescriptions = async function() {
    return await PrescriptionModel.find()
        .populate("patient", "firstName lastName JMBG")
        .populate("doctor", "firstName lastName specialization")
        .populate("medicalRecord")
        .populate("appointment")
        .sort({ issueDate: -1 });
};

var deletePrescriptionsForPatient = async function(patientId) {
    const prescriptions = await PrescriptionModel.find({ patient: patientId }).select('_id');
    
    if (prescriptions.length === 0) {
        return { deletedCount: 0, prescriptionIds: [] };
    }
    
    const prescriptionIds = prescriptions.map(prescription => prescription._id);
    const deleteResult = await PrescriptionModel.deleteMany({
        _id: { $in: prescriptionIds }
    });
    
    return {
        deletedCount: deleteResult.deletedCount || 0,
        prescriptionIds
    };
};

var nullifyPatientInPrescriptions = async function(patientId) {
    const prescriptions = await PrescriptionModel.find({ patient: patientId }).select('_id');
    
    if (prescriptions.length === 0) {
        return { updatedCount: 0, prescriptionIds: [] };
    }
    
    const prescriptionIds = prescriptions.map(prescription => prescription._id);
    const updateResult = await PrescriptionModel.updateMany(
        { _id: { $in: prescriptionIds } },
        { 
            $set: { 
                patient: null,
                updatedAt: new Date()
            }
        }
    );
    
    return {
        updatedCount: updateResult.modifiedCount || 0,
        prescriptionIds
    };
};

var stampPatientSnapshotInPrescriptions = async function(patient) {
    if (!patient || !patient._id) {
        return { updatedCount: 0, prescriptionIds: [] };
    }

    const prescriptions = await PrescriptionModel.find({ patient: patient._id }).select('_id');

    if (prescriptions.length === 0) {
        return { updatedCount: 0, prescriptionIds: [] };
    }

    const prescriptionIds = prescriptions.map(prescription => prescription._id);
    const updateResult = await PrescriptionModel.updateMany(
        { _id: { $in: prescriptionIds } },
        {
            $set: {
                patientSnapshot: buildPatientSnapshot(patient),
                updatedAt: new Date()
            }
        }
    );

    return {
        updatedCount: updateResult.modifiedCount || 0,
        prescriptionIds
    };
};

var stampDoctorSnapshotInPrescriptions = async function(doctor) {
    if (!doctor || !doctor._id) {
        return { updatedCount: 0, prescriptionIds: [] };
    }

    const prescriptions = await PrescriptionModel.find({ doctor: doctor._id }).select('_id');

    if (prescriptions.length === 0) {
        return { updatedCount: 0, prescriptionIds: [] };
    }

    const prescriptionIds = prescriptions.map(prescription => prescription._id);
    const updateResult = await PrescriptionModel.updateMany(
        { _id: { $in: prescriptionIds } },
        {
            $set: {
                doctorSnapshot: buildDoctorSnapshot(doctor),
                updatedAt: new Date()
            }
        }
    );

    return {
        updatedCount: updateResult.modifiedCount || 0,
        prescriptionIds
    };
};

module.exports = {
    createPrescription,
    getPrescriptionsByPatient,
    getPrescriptionById,
    updatePrescriptionStatus,
    addMedicationToPrescription,
    cancelMedicationInPrescription,
    getActivePrescriptions,
    deletePrescription,
    getAllPrescriptions,
    deletePrescriptionsForPatient,
    nullifyPatientInPrescriptions,
    stampPatientSnapshotInPrescriptions,
    stampDoctorSnapshotInPrescriptions
};


