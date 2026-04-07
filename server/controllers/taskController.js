const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

exports.getEventTasks = async (req, res) => {
    try {
        const { eventId } = req.params;
        const [rows] = await pool.query('SELECT * FROM event_tasks WHERE event_id = ? ORDER BY created_at DESC', [eventId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createTask = async (req, res) => {
    try {
        const { event_id, title } = req.body;
        const id = uuidv4();
        await pool.query('INSERT INTO event_tasks (id, event_id, title) VALUES (?, ?, ?)', [id, event_id, title]);
        res.status(201).json({ message: 'Task added', taskId: id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.toggleTask = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT is_completed FROM event_tasks WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });
        
        const newValue = !rows[0].is_completed;
        await pool.query('UPDATE event_tasks SET is_completed = ? WHERE id = ?', [newValue, id]);
        res.json({ message: 'Task updated', is_completed: newValue });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM event_tasks WHERE id = ?', [id]);
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
