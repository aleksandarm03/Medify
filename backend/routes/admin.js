const express = require('express');
const router = express.Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');
const User = require('../models/user');
const Appointment = require('../models/appointment');
const MedicalRecord = require('../models/medicalRecord');
const Prescription = require('../models/prescription');
const DoctorAvailability = require('../models/doctorAvailability');

// Sve admin rute zahtevaju autentifikaciju i admin ulogu
router.use(authenticateJWT);
router.use(requireRole(['admin']));

// GET /api/admin/dashboard - Kompletne statistike za admin dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Paralelno izvršavanje svih upita
        const [
            totalUsers,
            usersByRole,
            pendingApprovals,
            todayAppointments,
            weekAppointments,
            monthAppointments,
            appointmentsByStatus,
            recentActivities,
            topDoctors,
            systemHealth
        ] = await Promise.all([
            // Ukupan broj korisnika
            User.countDocuments({ isActive: true }),
            
            // Korisnici po ulogama
            User.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]),
            
            // Pending odobrenja
            User.find({ approvalStatus: 'pending', isActive: true })
                .select('firstName lastName role specialization createdAt')
                .sort({ createdAt: -1 }),
            
            // Termini danas
            Appointment.countDocuments({ 
                appointmentDate: { $gte: startOfToday, $lt: new Date(startOfToday.getTime() + 24*60*60*1000) }
            }),
            
            // Termini ove nedelje
            Appointment.countDocuments({ appointmentDate: { $gte: startOfWeek } }),
            
            // Termini ovog meseca
            Appointment.countDocuments({ appointmentDate: { $gte: startOfMonth } }),
            
            // Termini po statusu
            Appointment.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            
            // Nedavne aktivnosti (novi korisnici i termini)
            Promise.all([
                User.find({ isActive: true })
                    .select('firstName lastName role createdAt')
                    .sort({ createdAt: -1 })
                    .limit(5),
                Appointment.find()
                    .populate('patient', 'firstName lastName')
                    .populate('doctor', 'firstName lastName')
                    .select('patient doctor appointmentDate status createdAt')
                    .sort({ createdAt: -1 })
                    .limit(5)
            ]),
            
            // Top doktori po broju termina
            Appointment.aggregate([
                { $match: { status: { $in: ['scheduled', 'completed'] } } },
                { $group: { 
                    _id: '$doctor', 
                    totalAppointments: { $sum: 1 },
                    completedAppointments: { 
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    }
                }},
                { $sort: { totalAppointments: -1 } },
                { $limit: 5 },
                { $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'doctorInfo'
                }},
                { $unwind: '$doctorInfo' },
                { $project: {
                    doctorName: { $concat: ['$doctorInfo.firstName', ' ', '$doctorInfo.lastName'] },
                    specialization: '$doctorInfo.specialization',
                    totalAppointments: 1,
                    completedAppointments: 1,
                    completionRate: { 
                        $multiply: [
                            { $divide: ['$completedAppointments', '$totalAppointments'] },
                            100
                        ]
                    }
                }}
            ]),
            
            // System health checks
            Promise.all([
                MedicalRecord.countDocuments(),
                Prescription.countDocuments(),
                DoctorAvailability.countDocuments(),
                User.countDocuments({ role: 'doctor', isApproved: true, isActive: true })
            ])
        ]);

        // Formatiraj podatke
        const userRoleMap = {};
        usersByRole.forEach(item => {
            userRoleMap[item._id] = item.count;
        });

        const appointmentStatusMap = {};
        appointmentsByStatus.forEach(item => {
            appointmentStatusMap[item._id] = item.count;
        });

        const [recentUsers, recentAppointments] = recentActivities;
        const [totalRecords, totalPrescriptions, totalAvailabilities, activeDoctors] = systemHealth;

        res.json({
            overview: {
                totalUsers,
                totalAppointmentsToday: todayAppointments,
                totalAppointmentsWeek: weekAppointments,
                totalAppointmentsMonth: monthAppointments,
                pendingApprovalsCount: pendingApprovals.length
            },
            usersByRole: {
                admin: userRoleMap.admin || 0,
                doctor: userRoleMap.doctor || 0,
                patient: userRoleMap.patient || 0
            },
            appointmentsByStatus: {
                scheduled: appointmentStatusMap.scheduled || 0,
                completed: appointmentStatusMap.completed || 0,
                canceled: appointmentStatusMap.canceled || 0
            },
            pendingApprovals,
            recentUsers,
            recentAppointments,
            topDoctors,
            systemHealth: {
                totalMedicalRecords: totalRecords,
                totalPrescriptions,
                totalAvailabilities,
                activeDoctors,
                databaseStatus: 'connected'
            }
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'Greška pri učitavanju dashboard-a', error: error.message });
    }
});

// POST /api/admin/approve-user/:userId - Odobri korisnika
router.post('/approve-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Korisnik nije pronađen' });
        }

        if (user.approvalStatus === 'approved') {
            return res.status(400).json({ message: 'Korisnik je već odobren' });
        }

        user.isApproved = true;
        user.approvalStatus = 'approved';
        user.approvedBy = req.user._id;
        user.approvedAt = new Date();
        user.updatedAt = new Date();
        
        await user.save();

        res.json({ 
            message: 'Korisnik uspešno odobren',
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                approvalStatus: user.approvalStatus
            }
        });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ message: 'Greška pri odobravanju korisnika', error: error.message });
    }
});

// POST /api/admin/reject-user/:userId - Odbij korisnika
router.post('/reject-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Korisnik nije pronađen' });
        }

        user.isApproved = false;
        user.approvalStatus = 'rejected';
        user.approvedBy = req.user._id;
        user.approvedAt = new Date();
        user.updatedAt = new Date();
        
        await user.save();

        res.json({ 
            message: 'Korisnik odbijen',
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                approvalStatus: user.approvalStatus
            }
        });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ message: 'Greška pri odbijanju korisnika', error: error.message });
    }
});

// POST /api/admin/toggle-user/:userId - Enable/Disable korisnika
router.post('/toggle-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'Korisnik nije pronađen' });
        }

        if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Ne možete deaktivirati svoj nalog' });
        }

        user.isActive = !user.isActive;
        user.updatedAt = new Date();
        
        await user.save();

        res.json({ 
            message: user.isActive ? 'Korisnik aktiviran' : 'Korisnik deaktiviran',
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Toggle user error:', error);
        res.status(500).json({ message: 'Greška pri promeni statusa korisnika', error: error.message });
    }
});

// GET /api/admin/audit-log - Audit log (skorašnje izmene)
router.get('/audit-log', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        
        // Kombinuj različite izvore aktivnosti
        const [recentUsers, recentAppointments, recentRecords, recentPrescriptions] = await Promise.all([
            User.find()
                .select('firstName lastName role createdAt updatedAt approvalStatus')
                .sort({ updatedAt: -1 })
                .limit(limit),
            Appointment.find()
                .populate('patient', 'firstName lastName')
                .populate('doctor', 'firstName lastName')
                .select('patient doctor appointmentDate status createdAt updatedAt')
                .sort({ updatedAt: -1 })
                .limit(limit),
            MedicalRecord.find()
                .populate('patient', 'firstName lastName')
                .populate('doctor', 'firstName lastName')
                .select('patient doctor diagnosis createdAt')
                .sort({ createdAt: -1 })
                .limit(limit),
            Prescription.find()
                .populate('patient', 'firstName lastName')
                .populate('doctor', 'firstName lastName')
                .select('patient doctor status createdAt')
                .sort({ createdAt: -1 })
                .limit(limit)
        ]);

        res.json({
            recentUsers,
            recentAppointments,
            recentRecords,
            recentPrescriptions
        });
    } catch (error) {
        console.error('Audit log error:', error);
        res.status(500).json({ message: 'Greška pri učitavanju audit log-a', error: error.message });
    }
});

module.exports = router;
