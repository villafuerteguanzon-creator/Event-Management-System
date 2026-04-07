const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/', eventController.getAllEvents);
router.get('/categories', categoryController.getAllCategories);
router.get('/:id', eventController.getEventById);
router.get('/:id/attendees', authMiddleware, eventController.getEventAttendees);
router.post('/', authMiddleware, upload.single('image'), eventController.createEvent);
router.put('/:id', authMiddleware, upload.single('image'), eventController.updateEvent);
router.delete('/:id', authMiddleware, eventController.deleteEvent);

module.exports = router;
