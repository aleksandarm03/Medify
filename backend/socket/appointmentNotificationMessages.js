/**
 * Poruke za obaveštenja o promeni statusa termina (po ulozi primaoca).
 */

function formatCanceledAppointmentDate(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
        return '';
    }

    const datePart = date.toLocaleDateString('sr-RS', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const timePart = date.toLocaleTimeString('sr-RS', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    return `${datePart}. u ${timePart}`;
}

function getCanceledByUserId(appt) {
    const value = appt?.canceledByUser || appt?.canceledByUserId;
    if (!value) {
        return '';
    }
    if (typeof value === 'object' && value._id) {
        return String(value._id);
    }
    return String(value);
}

function getPatientName(appt) {
    if (appt?.patient) {
        return `${appt.patient.firstName || ''} ${appt.patient.lastName || ''}`.trim();
    }
    return appt?.patientName || '';
}

function buildCanceledStatusMessage(recipientRole, appt, recipientUserId) {
    const serviceName = appt?.reason || 'nepoznata usluga';
    const appointmentDate = formatCanceledAppointmentDate(appt?.appointmentDate || appt?.date) || 'nepoznat termin';
    const canceledByRole = appt?.canceledByRole || appt?.canceledBy || '';
    const canceledByUser = getCanceledByUserId(appt);
    const isSelfCancellation = Boolean(
        recipientUserId &&
        canceledByUser &&
        canceledByUser === String(recipientUserId)
    );
    const patientName = getPatientName(appt);

    if (recipientRole === 'doctor') {
        if (isSelfCancellation || canceledByRole === 'doctor') {
            return `Uspešno ste otkazali termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}.`;
        }
        if (canceledByRole === 'patient') {
            const name = patientName || 'Pacijent';
            return `Pacijent ${name} je otkazao termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}.`;
        }
        if (canceledByRole === 'admin') {
            return `Termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}, je otkazan od strane administratora.`;
        }
        return `Termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}, je otkazan.`;
    }

    if (isSelfCancellation || canceledByRole === 'patient') {
        return `Uspešno ste otkazali termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}.`;
    }
    if (canceledByRole === 'doctor') {
        return `Vaš termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}, je otkazan od strane doktora.`;
    }
    if (canceledByRole === 'admin') {
        return `Vaš termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}, je otkazan od strane administratora.`;
    }
    return `Vaš termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}, je otkazan.`;
}

function buildAppointmentStatusMessage(recipientRole, appt, recipientUserId) {
    const status = appt?.status || appt?.newStatus || '';
    const appointmentDate = formatCanceledAppointmentDate(appt?.appointmentDate || appt?.date);

    if (status === 'canceled' || status === 'cancelled') {
        return buildCanceledStatusMessage(recipientRole, appt, recipientUserId);
    }
    if (status === 'rescheduled') {
        return `Termin je prebačen na novo vreme: ${appointmentDate || 'nepoznat termin'}.`;
    }
    if (status === 'confirmed') {
        return `Termin je potvrđen za ${appointmentDate || 'nepoznat termin'}.`;
    }
    if (status === 'completed') {
        return `Termin je završen${appointmentDate ? ` (${appointmentDate})` : ''}.`;
    }

    return '';
}

module.exports = {
    buildAppointmentStatusMessage,
    formatCanceledAppointmentDate
};
