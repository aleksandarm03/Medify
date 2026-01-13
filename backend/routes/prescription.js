const router = require("express").Router();
const passport = require("./config");
const PrescriptionService = require("../services/prescriptionService");
const MedicalRecordService = require("../services/medicalRecordService");
const UserModel = require("../models/user");
const AppointmentModel = require("../models/appointment");

// Kreiranje recepta (samo doktori)
router.post("/",
    passport.authenticate("jwt", { session: false }),
    passport.authorizeRoles("doctor"),
    async function (req, res) {
        try {
            const { patientId, medicalRecordId, appointmentId, medications, validUntil, notes } = req.body;

            if (!patientId || !medications || !Array.isArray(medications) || medications.length === 0) {
                return res.status(400).json({ message: "Obavezna polja: patientId, medications (niz)." });
            }

            // Validacija lekova
            for (const med of medications) {
                if (!med.name || !med.dosage || !med.frequency || !med.duration) {
                    return res.status(400).json({ message: "Svaki lek mora imati: name, dosage, frequency, duration." });
                }
            }

            const doctor = req.user;
            const patient = await UserModel.findById(patientId);

            if (!patient) {
                return res.status(404).json({ message: "Pacijent nije pronađen." });
            }

            if (patient.role !== "patient") {
                return res.status(400).json({ message: "Korisnik mora biti pacijent." });
            }

            let medicalRecord = null;
            if (medicalRecordId) {
                medicalRecord = await MedicalRecordService.getMedicalRecordById(medicalRecordId);
                if (medicalRecord && medicalRecord.doctor._id.toString() !== doctor._id.toString()) {
                    return res.status(403).json({ message: "Nemate pravo da koristite ovaj medicinski karton." });
                }
            }

            let appointment = null;
            if (appointmentId) {
                appointment = await AppointmentModel.findById(appointmentId);
                if (appointment && appointment.doctor.toString() !== doctor._id.toString()) {
                    return res.status(403).json({ message: "Nemate pravo da koristite ovaj termin." });
                }
            }

            const prescription = await PrescriptionService.createPrescription(
                req.body,
                doctor,
                patient,
                medicalRecord,
                appointment
            );

            return res.status(201).json(prescription);
        } catch (error) {
            console.error("Create prescription error:", error);
            return res.status(500).json({ message: "Greška pri kreiranju recepta." });
        }
    }
);

// Dohvatanje recepata pacijenta
router.get("/patient/:patientId",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const user = req.user;
            const patientId = req.params.patientId;
            const status = req.query.status; // Opcioni filter

            // Provera prava pristupa
            if (user.role === "patient" && user._id.toString() !== patientId) {
                return res.status(403).json({ message: "Možete videti samo svoje recepte." });
            }

            let prescriptions;
            if (status) {
                prescriptions = await PrescriptionService.getPrescriptionsByPatient(patientId, status);
            } else {
                prescriptions = await PrescriptionService.getPrescriptionsByPatient(patientId);
            }

            return res.json(prescriptions);
        } catch (error) {
            console.error("Get prescriptions error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju recepata." });
        }
    }
);

// Dohvatanje aktivnih recepata pacijenta
router.get("/patient/:patientId/active",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const user = req.user;
            const patientId = req.params.patientId;

            if (user.role === "patient" && user._id.toString() !== patientId) {
                return res.status(403).json({ message: "Možete videti samo svoje recepte." });
            }

            const prescriptions = await PrescriptionService.getActivePrescriptions(patientId);
            return res.json(prescriptions);
        } catch (error) {
            console.error("Get active prescriptions error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju aktivnih recepata." });
        }
    }
);

// Dohvatanje određenog recepta
router.get("/:id",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const prescription = await PrescriptionService.getPrescriptionById(req.params.id);

            if (!prescription) {
                return res.status(404).json({ message: "Recept nije pronađen." });
            }

            // Provera prava pristupa
            const user = req.user;
            if (user.role !== "admin" && 
                user.role !== "doctor" &&
                prescription.patient._id.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Nemate pravo pristupa ovom receptu." });
            }

            return res.json(prescription);
        } catch (error) {
            console.error("Get prescription error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju recepta." });
        }
    }
);

// Ažuriranje statusa recepta
router.put("/:id/status",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const { status } = req.body;

            if (!status || !["active", "completed", "cancelled"].includes(status)) {
                return res.status(400).json({ message: "Nevažeći status. Dozvoljene vrednosti: active, completed, cancelled." });
            }

            const prescription = await PrescriptionService.getPrescriptionById(req.params.id);

            if (!prescription) {
                return res.status(404).json({ message: "Recept nije pronađen." });
            }

            // Provera prava pristupa (samo doktor ili admin)
            const user = req.user;
            if (user.role !== "admin" && prescription.doctor._id.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Samo doktor ili admin mogu menjati status recepta." });
            }

            const updatedPrescription = await PrescriptionService.updatePrescriptionStatus(req.params.id, status);
            return res.json(updatedPrescription);
        } catch (error) {
            console.error("Update prescription status error:", error);
            return res.status(500).json({ message: "Greška pri ažuriranju statusa recepta." });
        }
    }
);

module.exports = router;


