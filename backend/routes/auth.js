const router=require('express').Router();
const userService=require('../services/userService');
const passport=require('../routes/config');
const UserModel = require('../models/user');


router.post('/register',async (req,res)=>{
    try {
        // Validacija obaveznih polja
        const { JMBG, firstName, lastName, password, homeAddress, phoneNumber, gender, role } = req.body;
        
        if (!JMBG || !firstName || !lastName || !password || !homeAddress || !phoneNumber || !gender || !role) {
            return res.status(400).json({ message: "Sva obavezna polja moraju biti popunjena." });
        }

        if (!["admin", "doctor", "nurse", "patient"].includes(role)) {
            return res.status(400).json({ message: "Nevažeća uloga. Dozvoljene uloge: admin, doctor, nurse, patient." });
        }

        if (!["male", "female"].includes(gender)) {
            return res.status(400).json({ message: "Nevažeći pol. Dozvoljene vrednosti: male, female." });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Lozinka mora imati najmanje 6 karaktera." });
        }

        var user = await userService.register(req.body);
        
        if (user) {
            // Ne vraćamo password hash u odgovoru
            const userResponse = user.toObject();
            delete userResponse.passwordHash;
            delete userResponse.passwordSalt;
            return res.status(201).json(userResponse);
        } else {
            return res.status(400).json({ message: "Registracija nije uspela." });
        }
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Korisnik sa ovim JMBG-om već postoji." });
        }
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Greška pri registraciji." });
    }
});


router.post("/login",
    passport.authenticate("local", {session:false}),
    async function(req, res){
    try {
        const token = req.user.generateJwt();
        return res.json({ token: token });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Greška pri prijavljivanju." });
    }
})

router.get('/users', passport.authenticate("jwt",{session:false}),
passport.authorizeRoles("admin"),
    async function (req,res) {
        try {
            var users = await userService.findAllUsers();
            // Uklanjamo password hash i salt iz odgovora
            const sanitizedUsers = users.map(user => {
                const userObj = user.toObject();
                delete userObj.passwordHash;
                delete userObj.passwordSalt;
                return userObj;
            });
            return res.json(sanitizedUsers);
        } catch (error) {
            console.error("Get users error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju korisnika." });
        }
    }
)


module.exports=router;