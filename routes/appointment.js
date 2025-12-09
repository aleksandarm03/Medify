const router = require("express").Router();
const passport = require("./config");
const AppointmentService = require("../services/AppointmentService");
const UserModel = require("../models/user");


router.post("/",
    passport.authenticate("jwt", { session: false }),
    passport.authorizeRoles("doctor"),
    async function (req, res) {
        const doctor = req.user;
        const patient = await UserModel.findById(req.body.patientId);
        
        if (!patient) {
            return res.status(404).json({ message: "Pacijent nije pronađen" });
        }
        
        const appointment = await AppointmentService.createAppointment(req.body, doctor, patient);
        res.status(201).json(appointment);
    }
);

module.exports = router;