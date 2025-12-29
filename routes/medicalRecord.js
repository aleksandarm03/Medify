const router = require("express").Router();
const passport = require("./config");
const MedicalRecordService = require("../services/medicalRecordService");
const UserModel = require("../models/user");
const AppointmentModel = require("../models/appointment");

// Kreiranje medicinskog kartona (samo doktori)
router.post("/",
    passport.authenticate("jwt", { session: false }),
    passport.authorizeRoles("doctor", "nurse"),
    async function (req, res) {
        try {
            const { patientId, appointmentId, diagnosis, symptoms, examinationNotes, treatment, recommendations, vitalSigns, labResults, followUpDate } = req.body;

            if (!patientId || !diagnosis) {
                return res.status(400).json({ message: "Obavezna polja: patientId, diagnosis." });
            }

            if (diagnosis.trim().length < 3) {
                return res.status(400).json({ message: "Dijagnoza mora imati najmanje 3 karaktera." });
            }

            const doctor = req.user;
            const patient = await UserModel.findById(patientId);

            if (!patient) {
                return res.status(404).json({ message: "Pacijent nije pronađen." });
            }

            if (patient.role !== "patient") {
                return res.status(400).json({ message: "Korisnik mora biti pacijent." });
            }

            let appointment = null;
            if (appointmentId) {
                appointment = await AppointmentModel.findById(appointmentId);
                if (appointment && appointment.doctor.toString() !== doctor._id.toString()) {
                    return res.status(403).json({ message: "Nemate pravo da koristite ovaj termin." });
                }
            }

            const medicalRecord = await MedicalRecordService.createMedicalRecord(
                req.body,
                doctor,
                patient,
                appointment
            );

            return res.status(201).json(medicalRecord);
        } catch (error) {
            console.error("Create medical record error:", error);
            return res.status(500).json({ message: "Greška pri kreiranju medicinskog kartona." });
        }
    }
);

// Dohvatanje svih medicinskih kartona pacijenta
router.get("/patient/:patientId",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const user = req.user;
            const patientId = req.params.patientId;

            // Provera prava pristupa
            if (user.role === "patient" && user._id.toString() !== patientId) {
                return res.status(403).json({ message: "Možete videti samo svoje medicinske kartone." });
            }

            const medicalRecords = await MedicalRecordService.getMedicalRecordsByPatient(patientId);
            return res.json(medicalRecords);
        } catch (error) {
            console.error("Get medical records error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju medicinskih kartona." });
        }
    }
);

// Dohvatanje određenog medicinskog kartona
router.get("/:id",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const medicalRecord = await MedicalRecordService.getMedicalRecordById(req.params.id);

            if (!medicalRecord) {
                return res.status(404).json({ message: "Medicinski karton nije pronađen." });
            }

            // Provera prava pristupa
            const user = req.user;
            if (user.role !== "admin" && 
                user.role !== "doctor" && 
                user.role !== "nurse" &&
                medicalRecord.patient._id.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Nemate pravo pristupa ovom medicinskom kartona." });
            }

            return res.json(medicalRecord);
        } catch (error) {
            console.error("Get medical record error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju medicinskog kartona." });
        }
    }
);

// Ažuriranje medicinskog kartona
router.put("/:id",
    passport.authenticate("jwt", { session: false }),
    passport.authorizeRoles("doctor", "nurse", "admin"),
    async function (req, res) {
        try {
            const medicalRecord = await MedicalRecordService.getMedicalRecordById(req.params.id);

            if (!medicalRecord) {
                return res.status(404).json({ message: "Medicinski karton nije pronađen." });
            }

            // Provera da li doktor ima pravo da menja ovaj karton
            const user = req.user;
            if (user.role !== "admin" && medicalRecord.doctor._id.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Možete menjati samo svoje medicinske kartone." });
            }

            const updatedRecord = await MedicalRecordService.updateMedicalRecord(req.params.id, req.body);
            return res.json(updatedRecord);
        } catch (error) {
            console.error("Update medical record error:", error);
            return res.status(500).json({ message: "Greška pri ažuriranju medicinskog kartona." });
        }
    }
);

// Dodavanje laboratorijskog rezultata
router.post("/:id/lab-results",
    passport.authenticate("jwt", { session: false }),
    passport.authorizeRoles("doctor", "nurse", "admin"),
    async function (req, res) {
        try {
            const { testName, result, normalRange } = req.body;

            if (!testName || !result) {
                return res.status(400).json({ message: "Obavezna polja: testName, result." });
            }

            const medicalRecord = await MedicalRecordService.getMedicalRecordById(req.params.id);

            if (!medicalRecord) {
                return res.status(404).json({ message: "Medicinski karton nije pronađen." });
            }

            const user = req.user;
            if (user.role !== "admin" && medicalRecord.doctor._id.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Nemate pravo da dodajete rezultate u ovaj karton." });
            }

            const labResult = {
                testName,
                result,
                normalRange: normalRange || "",
                date: new Date()
            };

            const updatedRecord = await MedicalRecordService.addLabResult(req.params.id, labResult);
            return res.json(updatedRecord);
        } catch (error) {
            console.error("Add lab result error:", error);
            return res.status(500).json({ message: "Greška pri dodavanju laboratorijskog rezultata." });
        }
    }
);

module.exports = router;

