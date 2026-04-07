const pool = require('../config/db');

exports.getAllEvents = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT e.*, u.full_name as organizer_name, v.name as venue_name, c.name as category_name 
            FROM events e
            LEFT JOIN users u ON e.organizer_id = u.id
            LEFT JOIN venues v ON e.venue_id = v.id
            LEFT JOIN categories c ON e.category_id = c.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Event not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { title, description, start_time, end_time, price, capacity, organizer_id, venue_id, category_id, status } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const [result] = await pool.query(
            'INSERT INTO events (title, description, start_time, end_time, price, capacity, image_url, organizer_id, venue_id, category_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, start_time, end_time, price, capacity, image_url, organizer_id, venue_id, category_id, status || 'published']
        );
        res.status(201).json({ message: 'Event created successfully', eventId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, start_time, end_time, price, capacity, venue_id, category_id, status } = req.body;
        let query = 'UPDATE events SET title = ?, description = ?, start_time = ?, end_time = ?, price = ?, capacity = ?, venue_id = ?, category_id = ?, status = ?';
        let params = [title, description, start_time, end_time, price, capacity, venue_id, category_id, status];

        if (req.file) {
            query += ', image_url = ?';
            params.push(`/uploads/${req.file.filename}`);
        }

        query += ' WHERE id = ?';
        params.push(id);
        
        await pool.query(query, params);
        res.json({ message: 'Event updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getEventAttendees = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT b.*, u.full_name, u.email 
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE b.event_id = ? AND b.status != 'cancelled'
        `, [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM events WHERE id = ?', [id]);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
