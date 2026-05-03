const router=require('express').Router();
const userService=require('../services/userService');
const AppointmentService = require('../services/appointmentService');
const socketEmitter = require('../socket/socketEmitter');
const passport=require('../routes/config');
const UserModel = require('../models/user');

function formatUserDisplayName(user, fallback = 'korisnika') {
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || fallback;
}

function formatRoleLabel(role) {
    if (role === 'doctor') {
        return 'doktora';
    }

    if (role === 'patient') {
        return 'pacijenta';
    }

    return 'korisnika';
}


router.post('/register',async (req,res)=>{
    try {
        // Validacija obaveznih polja
        const { JMBG, firstName, lastName, password, homeAddress, phoneNumber, gender, role } = req.body;
        
        if (!JMBG || !firstName || !lastName || !password || !homeAddress || !phoneNumber || !gender || !role) {
            return res.status(400).json({ message: "Sva obavezna polja moraju biti popunjena." });
        }

        if (!["admin", "doctor", "patient"].includes(role)) {
            return res.status(400).json({ message: "Nevažeća uloga. Dozvoljene uloge: admin, doctor, patient." });
        }

        if (!["male", "female"].includes(gender)) {
            return res.status(400).json({ message: "Nevažeći pol. Dozvoljene vrednosti: male, female." });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Lozinka mora imati najmanje 6 karaktera." });
        }

        if (req.body.dateOfBirth) {
            const birthDate = new Date(req.body.dateOfBirth);
            if (Number.isNaN(birthDate.getTime())) {
                return res.status(400).json({ message: "Datum rođenja nije ispravan." });
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            birthDate.setHours(0, 0, 0, 0);

            if (birthDate > today) {
                return res.status(400).json({ message: "Datum rođenja ne može biti u budućnosti." });
            }
        }

        var user = await userService.register(req.body);
        
        if (user) {
            // Vraćamo token da bi frontend mogao da završi auto-login tok nakon registracije.
            const token = user.generateJwt();
            const userResponse = user.toObject();
            delete userResponse.passwordHash;
            delete userResponse.passwordSalt;
            return res.status(201).json({ token, user: userResponse });
        } else {
            return res.status(400).json({ message: "Registracija nije uspela." });
        }
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Korisnik sa ovim JMBG-om već postoji." });
        }

        if (error.status === 400) {
            return res.status(400).json({ message: error.message });
        }

        console.error("Registration error:", error);
        return res.status(500).json({ message: "Greška pri registraciji." });
    }
});


router.post('/login', function (req, res, next) {
    passport.authenticate('local', { session: false }, async (err, user, info) => {
        if (err) {
            console.error('Login auth error:', err);
            return res.status(500).json({ message: 'Greška pri prijavljivanju.' });
        }

        if (!user) {
            const messageMap = {
                'Credentials not valid!': 'Neispravni kredencijali.',
                'Role not supported': 'Uloga korisnika nije podržana.',
                'Account disabled': 'Vaš nalog je deaktiviran. Kontaktirajte administratora.',
                'Account not approved': 'Vaš nalog još nije odobren od strane administratora.'
            };

            const message = messageMap[info?.message] || 'Neuspešna prijava.';
            return res.status(401).json({ message });
        }

        try {
            const token = user.generateJwt();
            return res.json({ token });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ message: 'Greška pri prijavljivanju.' });
        }
    })(req, res, next);
});

// Endpoint za validaciju tokena
router.get('/validate-token', 
    passport.authenticate("jwt", {session: false}),
    function (req, res) {
        // Ako je stiglo ovde, znači da je token validan
        return res.status(200).send();
    }
)

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

// Dohvatanje pojedinačnog korisnika
router.get('/users/:id', passport.authenticate("jwt",{session:false}),
passport.authorizeRoles("admin"),
    async function (req,res) {
        try {
            const user = await userService.findUserById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: "Korisnik nije pronađen." });
            }
            const userObj = user.toObject();
            delete userObj.passwordHash;
            delete userObj.passwordSalt;
            return res.json(userObj);
        } catch (error) {
            console.error("Get user error:", error);
            return res.status(500).json({ message: "Greška pri dohvatanju korisnika." });
        }
    }
)

// Ažuriranje korisnika
router.put('/users/:id', passport.authenticate("jwt",{session:false}),
passport.authorizeRoles("admin"),
    async function (req,res) {
        try {
            const updatedUser = await userService.updateUser(req.params.id, req.body);
            if (!updatedUser) {
                return res.status(404).json({ message: "Korisnik nije pronađen." });
            }

            const adminName = formatUserDisplayName(req.user, 'Administrator');
            const updatedUserName = formatUserDisplayName(updatedUser);
            const updatedUserLabel = formatRoleLabel(updatedUser.role);
            const updateMessage = `${adminName} je editovao ${updatedUserLabel} ${updatedUserName}`;

            socketEmitter.notifyAllAdmins(updateMessage, {
                eventType: 'user-updated',
                userId: String(updatedUser._id),
                userName: updatedUserName,
                userRole: updatedUser.role,
                performedById: String(req.user._id),
                performedByName: adminName,
                type: 'info'
            }, String(req.user._id));

            const userObj = updatedUser.toObject();
            delete userObj.passwordHash;
            delete userObj.passwordSalt;
            return res.json(userObj);
        } catch (error) {
            console.error("Update user error:", error);
            return res.status(500).json({ message: "Greška pri ažuriranju korisnika." });
        }
    }
)

// Brisanje korisnika
router.delete('/users/:id', passport.authenticate("jwt",{session:false}),
passport.authorizeRoles("admin"),
    async function (req,res) {
        try {
            const userToDelete = await userService.findUserById(req.params.id);
            if (!userToDelete) {
                return res.status(404).json({ message: "Korisnik nije pronađen." });
            }

            const roleLabel = userToDelete.role === 'doctor'
                ? 'doktora'
                : userToDelete.role === 'patient'
                    ? 'pacijenta'
                    : 'korisnika';

            const cancellationReason = `Termin je automatski otkazan jer je administratorski obrisan nalog ${roleLabel}.`;

            const canceledByRole = ['doctor', 'patient'].includes(userToDelete.role)
                ? userToDelete.role
                : 'admin';

            const canceledAppointments = await AppointmentService.cancelScheduledAppointmentsForUser(
                String(userToDelete._id),
                {
                    canceledByRole,
                    canceledByUser: req.user._id,
                    cancellationReason
                }
            );

            canceledAppointments.forEach((appointment) => {
                socketEmitter.emitAppointmentStatusUpdated(
                    String(appointment._id),
                    String(appointment.patient?._id || appointment.patient),
                    String(appointment.doctor?._id || appointment.doctor),
                    'canceled',
                    cancellationReason
                );
            });

            const deletedUser = await userService.deleteUser(req.params.id);

            const adminName = formatUserDisplayName(req.user, 'Administrator');
            const deletedUserName = formatUserDisplayName(userToDelete);
            const deletedUserLabel = formatRoleLabel(userToDelete.role);
            const deleteMessage = `${adminName} je obrisao ${deletedUserLabel} ${deletedUserName}`;

            socketEmitter.notifyAllAdmins(deleteMessage, {
                eventType: 'user-deleted',
                userId: String(userToDelete._id),
                userName: deletedUserName,
                userRole: userToDelete.role,
                performedById: String(req.user._id),
                performedByName: adminName,
                canceledAppointments: canceledAppointments.length,
                type: 'warning'
            }, String(req.user._id));

            return res.json({
                message: "Korisnik je uspešno obrisan.",
                canceledAppointments: canceledAppointments.length
            });
        } catch (error) {
            console.error("Delete user error:", error);
            return res.status(500).json({ message: "Greška pri brisanju korisnika." });
        }
    }
)


module.exports=router;