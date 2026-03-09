const router = require('express').Router();
const passport = require('./config');
const userService = require('../services/userService');

// GET /api/profile - Dobavi pun profil trenutno ulogovanog korisnika
router.get('/', 
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const userId = req.user._id;
            const user = await userService.findUserById(userId);
            
            if (!user) {
                return res.status(404).json({ message: "Korisnik nije pronađen." });
            }

            // Uklanjamo password hash i salt
            const userProfile = user.toObject();
            delete userProfile.passwordHash;
            delete userProfile.passwordSalt;
            
            return res.json(userProfile);
        } catch (error) {
            console.error("Get profile error:", error);
            return res.status(500).json({ message: "Greška pri učitavanju profila." });
        }
    }
);

// PUT /api/profile - Ažuriraj profil trenutno ulogovanog korisnika
router.put('/', 
    passport.authenticate("jwt", { session: false }),
    async function (req, res) {
        try {
            const userId = req.user._id;
            const updateData = req.body;

            // Zaštita - ne dozvoljavamo menjanje kritičnih polja
            delete updateData._id;
            delete updateData.passwordHash;
            delete updateData.passwordSalt;
            delete updateData.password;
            delete updateData.role; // Role se ne može menjati kroz profil
            delete updateData.JMBG; // JMBG se ne može menjati

            // Validacija polja
            if (updateData.phoneNumber && !/^[\d\s\+\-\(\)]+$/.test(updateData.phoneNumber)) {
                return res.status(400).json({ message: "Nevažeći format broja telefona." });
            }

            if (updateData.gender && !["male", "female"].includes(updateData.gender)) {
                return res.status(400).json({ message: "Nevažeći pol. Dozvoljene vrednosti: male, female." });
            }

            if (updateData.bloodType && !["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].includes(updateData.bloodType)) {
                return res.status(400).json({ message: "Nevažeća krvna grupa." });
            }

            if (updateData.shift && !["morning", "evening", "night"].includes(updateData.shift)) {
                return res.status(400).json({ message: "Nevažeća smena." });
            }

            const updatedUser = await userService.updateUser(userId, updateData);
            
            if (!updatedUser) {
                return res.status(404).json({ message: "Korisnik nije pronađen." });
            }

            // Uklanjamo password hash i salt iz odgovora
            const userProfile = updatedUser.toObject();
            delete userProfile.passwordHash;
            delete userProfile.passwordSalt;
            
            return res.json(userProfile);
        } catch (error) {
            console.error("Update profile error:", error);
            return res.status(500).json({ message: "Greška pri ažuriranju profila." });
        }
    }
);

module.exports = router;
