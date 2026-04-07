const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/event/:eventId', authMiddleware, taskController.getEventTasks);
router.post('/', authMiddleware, taskController.createTask);
router.put('/:id/toggle', authMiddleware, taskController.toggleTask);
router.delete('/:id', authMiddleware, taskController.deleteTask);

module.exports = router;
