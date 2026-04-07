const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', venueController.getAllVenues);
router.post('/', authMiddleware, venueController.createVenue);
router.get('/:id', venueController.getVenueById);
router.put('/:id', authMiddleware, venueController.updateVenue);
router.delete('/:id', authMiddleware, venueController.deleteVenue);

module.exports = router;
