const router = require("express").Router();
const passport = require("./config");
const AppointmentService = require("../services/appointmentService");
const UserModel = require("../models/user");


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

module.exports = router;