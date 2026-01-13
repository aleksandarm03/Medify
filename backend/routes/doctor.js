const router = require("express").Router();
const passport = require("./config");
const DoctorAvailabilityService = require("../services/doctorAvailabilityService");
const UserModel = require("../models/user");

// Pretraga doktora po specijalizaciji
router.get("/search",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const { specialization, name } = req.query;
            const query = { role: "doctor" };

            if (specialization) {
                query.specialization = new RegExp(specialization, "i");
            }

            if (name) {
                query.$or = [
                    { firstName: new RegExp(name, "i") },
                    { lastName: new RegExp(name, "i") }
                ];
            }

            const doctors = await UserModel.find(query)
                .select("firstName lastName specialization yearsOfExperience officeNumber phoneNumber")
                .sort({ lastName: 1, firstName: 1 });

            return res.json(doctors);
        } catch (error) {
            console.error("Search doctors error:", error);
            return res.status(500).json({ message: "Greška pri pretrazi doktora." });
        }
    }
);

// Dohvatanje svih doktora
router.get("/",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const doctors = await UserModel.find({ role: "doctor" })
                .select("firstName lastName specialization yearsOfExperience officeNumber phoneNumber")
                .sort({ lastName: 1, firstName: 1 });

            return res.json(doctors);
        } catch (error) {
            console.error("Get doctors error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju doktora." });
        }
    }
);

// Dohvatanje određenog doktora
router.get("/:id",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const doctor = await UserModel.findById(req.params.id)
                .select("firstName lastName specialization yearsOfExperience officeNumber phoneNumber shift licenseNumber");

            if (!doctor || doctor.role !== "doctor") {
                return res.status(404).json({ message: "Doktor nije pronađen." });
            }

            return res.json(doctor);
        } catch (error) {
            console.error("Get doctor error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju doktora." });
        }
    }
);

// Postavljanje dostupnosti doktora
router.post("/:id/availability",
    passport.authenticate("jwt", { session: false }),
    passport.authorizeRoles("doctor", "admin"),
    async function (req, res) {
        try {
            const doctorId = req.params.id;
            const user = req.user;

            // Provera da li doktor menja svoju dostupnost ili je admin
            if (user.role !== "admin" && user._id.toString() !== doctorId) {
                return res.status(403).json({ message: "Možete postaviti samo svoju dostupnost." });
            }

            const { dayOfWeek, startTime, endTime, isAvailable, breakStart, breakEnd, appointmentDuration } = req.body;

            if (dayOfWeek === undefined || !startTime || !endTime) {
                return res.status(400).json({ message: "Obavezna polja: dayOfWeek (0-6), startTime, endTime." });
            }

            if (dayOfWeek < 0 || dayOfWeek > 6) {
                return res.status(400).json({ message: "dayOfWeek mora biti između 0 (nedelja) i 6 (subota)." });
            }

            // Validacija formata vremena
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
                return res.status(400).json({ message: "Vreme mora biti u formatu HH:MM (npr. 09:00)." });
            }

            const availability = await DoctorAvailabilityService.setDoctorAvailability(doctorId, {
                dayOfWeek,
                startTime,
                endTime,
                isAvailable: isAvailable !== false,
                breakStart,
                breakEnd,
                appointmentDuration: appointmentDuration || 30
            });

            return res.status(201).json(availability);
        } catch (error) {
            console.error("Set doctor availability error:", error);
            return res.status(500).json({ message: "Greška pri postavljanju dostupnosti." });
        }
    }
);

// Dohvatanje dostupnosti doktora
router.get("/:id/availability",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const doctorId = req.params.id;
            const availability = await DoctorAvailabilityService.getDoctorAvailability(doctorId);
            return res.json(availability);
        } catch (error) {
            console.error("Get doctor availability error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju dostupnosti." });
        }
    }
);

// Dohvatanje dostupnih termina za doktora na određeni datum
router.get("/:id/available-slots",
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const doctorId = req.params.id;
            const { date } = req.query;

            if (!date) {
                return res.status(400).json({ message: "Obavezno polje: date (format: YYYY-MM-DD)." });
            }

            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                return res.status(400).json({ message: "Nevažeći format datuma. Koristite YYYY-MM-DD." });
            }

            const slots = await DoctorAvailabilityService.getAvailableTimeSlots(doctorId, date);
            return res.json({ date: date, availableSlots: slots });
        } catch (error) {
            console.error("Get available slots error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju dostupnih termina." });
        }
    }
);

// Ažuriranje dostupnosti doktora
router.put("/availability/:availabilityId",
    passport.authenticate("jwt", { session: false }),
    passport.authorizeRoles("doctor", "admin"),
    async function (req, res) {
        try {
            const availability = await DoctorAvailabilityService.getDoctorAvailability(req.user._id);
            const availabilityRecord = availability.find(a => a._id.toString() === req.params.availabilityId);

            if (!availabilityRecord) {
                return res.status(404).json({ message: "Dostupnost nije pronađena." });
            }

            const user = req.user;
            if (user.role !== "admin" && availabilityRecord.doctor.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Možete menjati samo svoju dostupnost." });
            }

            const updatedAvailability = await DoctorAvailabilityService.updateDoctorAvailability(
                req.params.availabilityId,
                req.body
            );

            return res.json(updatedAvailability);
        } catch (error) {
            console.error("Update doctor availability error:", error);
            return res.status(500).json({ message: "Greška pri ažuriranju dostupnosti." });
        }
    }
);

// Brisanje dostupnosti doktora
router.delete("/availability/:availabilityId",
    passport.authenticate("jwt", { session: false }),
    passport.authorizeRoles("doctor", "admin"),
    async function (req, res) {
        try {
            const availability = await DoctorAvailabilityService.getDoctorAvailability(req.user._id);
            const availabilityRecord = availability.find(a => a._id.toString() === req.params.availabilityId);

            if (!availabilityRecord) {
                return res.status(404).json({ message: "Dostupnost nije pronađena." });
            }

            const user = req.user;
            if (user.role !== "admin" && availabilityRecord.doctor.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Možete obrisati samo svoju dostupnost." });
            }

            await DoctorAvailabilityService.deleteDoctorAvailability(req.params.availabilityId);
            return res.json({ message: "Dostupnost je uspešno obrisana." });
        } catch (error) {
            console.error("Delete doctor availability error:", error);
            return res.status(500).json({ message: "Greška pri brisanju dostupnosti." });
        }
    }
);

module.exports = router;


