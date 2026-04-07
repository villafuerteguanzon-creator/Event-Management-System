const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, bookingController.createBooking);
router.get('/user/:userId', authMiddleware, bookingController.getUserBookings);
router.get('/admin/all', authMiddleware, bookingController.getAllBookings);
router.get('/:id/ticket', authMiddleware, bookingController.generateTicket);
router.put('/:id', authMiddleware, bookingController.updateBooking);
router.put('/:id/cancel', authMiddleware, bookingController.cancelBooking);
router.delete('/:id', authMiddleware, bookingController.deleteBooking);
router.put('/:id/check-in', authMiddleware, bookingController.toggleCheckIn);
router.get('/event/:eventId/export', authMiddleware, bookingController.exportAttendeesCSV);

module.exports = router;
