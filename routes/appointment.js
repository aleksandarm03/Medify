const router = require("express").Router();
const passport = require("./config");
const AppointmentService = require("../services/appointmentService");
const UserModel = require("../models/user");

// Kreiranje novog termina (samo doktori)
router.post("/",
    passport.authenticate("jwt", { session: false }),
    passport.authorizeRoles("doctor"),
    async function (req, res) {
        try {
            // Validacija obaveznih polja
            const { patientId, appointmentDate, reason } = req.body;
            
            if (!patientId || !appointmentDate || !reason) {
                return res.status(400).json({ message: "Sva obavezna polja moraju biti popunjena: patientId, appointmentDate, reason." });
            }

            // Validacija da je appointmentDate validan datum
            const appointmentDateObj = new Date(appointmentDate);
            if (isNaN(appointmentDateObj.getTime())) {
                return res.status(400).json({ message: "Nevažeći format datuma." });
            }

            // Validacija da datum nije u prošlosti
            if (appointmentDateObj < new Date()) {
                return res.status(400).json({ message: "Datum termina ne može biti u prošlosti." });
            }

            // Validacija da je reason dovoljno dugačak
            if (reason.trim().length < 3) {
                return res.status(400).json({ message: "Razlog termina mora imati najmanje 3 karaktera." });
            }

            const doctor = req.user;
            const patient = await UserModel.findById(patientId);
            
            if (!patient) {
                return res.status(404).json({ message: "Pacijent nije pronađen." });
            }

            // Provera da li je korisnik zaista pacijent
            if (patient.role !== "patient") {
                return res.status(400).json({ message: "Korisnik mora biti pacijent." });
            }
            
            const appointment = await AppointmentService.createAppointment(req.body, doctor, patient);
            return res.status(201).json(appointment);
        } catch (error) {
            console.error("Create appointment error:", error);
            return res.status(500).json({ message: "Greška pri kreiranju termina." });
        }
    }
);

// Dohvatanje termina za doktora
router.get("/doctor",
    passport.authenticate("jwt", { session: false }),
    passport.authorizeRoles("doctor"),
    async function (req, res) {
        try {
            const doctorId = req.user._id;
            const status = req.query.status; // Opcioni filter po statusu
            const appointments = await AppointmentService.getAppointmentsByDoctor(doctorId, status);
            return res.json(appointments);
        } catch (error) {
            console.error("Get doctor appointments error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju termina." });
        }
    }
);

// Dohvatanje termina za pacijenta
router.get("/patient",
    passport.authenticate("jwt", { session: false }),
    passport.authorizeRoles("patient"),
    async function (req, res) {
        try {
            const patientId = req.user._id;
            const status = req.query.status; // Opcioni filter po statusu
            const appointments = await AppointmentService.getAppointmentsByPatient(patientId, status);
            return res.json(appointments);
        } catch (error) {
            console.error("Get patient appointments error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju termina." });
        }
    }
);

// Dohvatanje određenog termina po ID-u
router.get("/:id",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const appointment = await AppointmentService.getAppointmentById(req.params.id);
            
            if (!appointment) {
                return res.status(404).json({ message: "Termin nije pronađen." });
            }

            // Provera da li korisnik ima pravo da vidi ovaj termin
            const user = req.user;
            if (user.role !== "admin" && 
                appointment.doctor._id.toString() !== user._id.toString() && 
                appointment.patient._id.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Nemate pravo pristupa ovom terminu." });
            }

            return res.json(appointment);
        } catch (error) {
            console.error("Get appointment error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju termina." });
        }
    }
);

// Ažuriranje statusa termina
router.put("/:id/status",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const { status } = req.body;
            
            if (!status || !["scheduled", "completed", "canceled"].includes(status)) {
                return res.status(400).json({ message: "Nevažeći status. Dozvoljene vrednosti: scheduled, completed, canceled." });
            }

            const appointment = await AppointmentService.getAppointmentById(req.params.id);
            
            if (!appointment) {
                return res.status(404).json({ message: "Termin nije pronađen." });
            }

            // Provera prava pristupa
            const user = req.user;
            if (user.role !== "admin" && 
                appointment.doctor._id.toString() !== user._id.toString() && 
                appointment.patient._id.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Nemate pravo da menjate ovaj termin." });
            }

            const updatedAppointment = await AppointmentService.updateAppointmentStatus(req.params.id, status);
            return res.json(updatedAppointment);
        } catch (error) {
            console.error("Update appointment status error:", error);
            return res.status(500).json({ message: "Greška pri ažuriranju statusa termina." });
        }
    }
);

// Ažuriranje termina
router.put("/:id",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const appointment = await AppointmentService.getAppointmentById(req.params.id);
            
            if (!appointment) {
                return res.status(404).json({ message: "Termin nije pronađen." });
            }

            // Provera prava pristupa (samo doktor ili admin)
            const user = req.user;
            if (user.role !== "admin" && appointment.doctor._id.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Samo doktor ili admin mogu menjati termin." });
            }

            // Validacija ako se menja datum
            if (req.body.appointmentDate) {
                const appointmentDateObj = new Date(req.body.appointmentDate);
                if (isNaN(appointmentDateObj.getTime())) {
                    return res.status(400).json({ message: "Nevažeći format datuma." });
                }
            }

            const updateData = {};
            if (req.body.appointmentDate) updateData.appointmentDate = new Date(req.body.appointmentDate);
            if (req.body.reason) updateData.reason = req.body.reason;
            if (req.body.status) updateData.status = req.body.status;

            const updatedAppointment = await AppointmentService.updateAppointment(req.params.id, updateData);
            return res.json(updatedAppointment);
        } catch (error) {
            console.error("Update appointment error:", error);
            return res.status(500).json({ message: "Greška pri ažuriranju termina." });
        }
    }
);

// Brisanje termina
router.delete("/:id",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const appointment = await AppointmentService.getAppointmentById(req.params.id);
            
            if (!appointment) {
                return res.status(404).json({ message: "Termin nije pronađen." });
            }

            // Provera prava pristupa (samo doktor ili admin)
            const user = req.user;
            if (user.role !== "admin" && appointment.doctor._id.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Samo doktor ili admin mogu obrisati termin." });
            }

            await AppointmentService.deleteAppointment(req.params.id);
            return res.json({ message: "Termin je uspešno obrisan." });
        } catch (error) {
            console.error("Delete appointment error:", error);
            return res.status(500).json({ message: "Greška pri brisanju termina." });
        }
    }
);

module.exports = router;