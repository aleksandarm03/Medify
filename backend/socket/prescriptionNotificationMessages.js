/**
 * Poruke obaveštenja za pacijenta o promenama na receptu.
 */

function getDoctorName(prescription, doctorOverride) {
    if (doctorOverride) {
        return `${doctorOverride.firstName || ''} ${doctorOverride.lastName || ''}`.trim() || 'Doktor';
    }

    const snap = prescription?.doctorSnapshot;
    const doc = prescription?.doctor;

    if (doc && typeof doc === 'object') {
        const name = `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
        if (name) {
            return name;
        }
    }

    if (snap) {
        const name = `${snap.firstName || ''} ${snap.lastName || ''}`.trim();
        if (name) {
            return name;
        }
    }

    return 'Doktor';
}

function getMedicalRecordDiagnosis(prescription, options = {}) {
    if (options.medicalRecordDiagnosis) {
        return options.medicalRecordDiagnosis;
    }

    const record = prescription?.medicalRecord;
    if (record && typeof record === 'object' && record.diagnosis) {
        return record.diagnosis;
    }

    return '';
}

function getMedicationNamesSummary(medications) {
    if (!Array.isArray(medications)) {
        return '';
    }

    return medications
        .filter((med) => !med.status || med.status === 'active')
        .map((med) => med.name)
        .filter(Boolean)
        .slice(0, 5)
        .join(', ');
}

function buildPrescriptionNotificationMessage(action, prescription, options = {}) {
    const doctorName = getDoctorName(prescription, options.doctor);
    const medicationName = options.medicationName || '';
    const diagnosis = getMedicalRecordDiagnosis(prescription, options);
    const hasMedicalRecord = Boolean(
        options.hasMedicalRecord ||
        prescription?.medicalRecord ||
        diagnosis
    );

    switch (action) {
        case 'created':
            if (hasMedicalRecord) {
                return diagnosis
                    ? `Doktor ${doctorName} je kreirao novi recept na osnovu kartona (dijagnoza: ${diagnosis}).`
                    : `Doktor ${doctorName} je kreirao novi recept na osnovu kartona.`;
            }
            return `Doktor ${doctorName} je kreirao novi recept za vas.`;
        case 'medication_added':
            return medicationName
                ? `Doktor ${doctorName} je dodao lek „${medicationName}” na vaš recept.`
                : `Doktor ${doctorName} je dodao novi lek na vaš recept.`;
        case 'medication_cancelled':
            return medicationName
                ? `Doktor ${doctorName} je otkazao lek „${medicationName}” na vaš recept.`
                : `Doktor ${doctorName} je otkazao lek na vaš recept.`;
        case 'completed':
            return `Doktor ${doctorName} je završio vaš recept.`;
        case 'cancelled':
            return `Doktor ${doctorName} je otkazao vaš recept.`;
        default:
            return `Doktor ${doctorName} je ažurirao vaš recept.`;
    }
}

function getNotificationTitle(action) {
    const titles = {
        created: 'Novi recept',
        medication_added: 'Lek dodat na recept',
        medication_cancelled: 'Lek otkazan',
        completed: 'Recept završen',
        cancelled: 'Recept otkazan'
    };

    return titles[action] || 'Obaveštenje o receptu';
}

module.exports = {
    getDoctorName,
    getMedicationNamesSummary,
    buildPrescriptionNotificationMessage,
    getNotificationTitle
};
