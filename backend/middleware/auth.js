const passport = require('../routes/config');

/**
 * Middleware za JWT autentifikaciju
 * Koristi passport JWT strategiju da verifikuje token iz Authorization header-a
 */
const authenticateJWT = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: 'Greška pri autentifikaciji', error: err.message });
        }
        
        if (!user) {
            return res.status(401).json({ message: 'Neautorizovani pristup. Token nije validan.' });
        }
        
        // Provera da li je korisnik odobren (za doctor i nurse role)
        if ((user.role === 'doctor' || user.role === 'nurse') && !user.isApproved) {
            return res.status(403).json({ 
                message: 'Vaš nalog čeka odobrenje od strane administratora.' 
            });
        }
        
        // Provera da li je korisnik aktivan
        if (!user.isActive) {
            return res.status(403).json({ 
                message: 'Vaš nalog je deaktiviran. Kontaktirajte administratora.' 
            });
        }
        
        req.user = user;
        next();
    })(req, res, next);
};

/**
 * Middleware za autorizaciju na osnovu uloga
 * @param {Array<string>} roles - Lista dozvoljenih uloga
 * @returns {Function} Express middleware funkcija
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Morate biti ulogovani.' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Nemate dozvolu za pristup ovom resursu.',
                requiredRoles: roles,
                yourRole: req.user.role
            });
        }
        
        next();
    };
};

module.exports = {
    authenticateJWT,
    requireRole
};
