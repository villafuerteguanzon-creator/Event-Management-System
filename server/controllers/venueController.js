const pool = require('../config/db');

exports.getAllVenues = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM venues');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createVenue = async (req, res) => {
    try {
        const { name, address, capacity } = req.body;
        const [result] = await pool.query(
            'INSERT INTO venues (name, address, capacity) VALUES (?, ?, ?)',
            [name, address, capacity]
        );
        res.status(201).json({ message: 'Venue created successfully', venueId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getVenueById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM venues WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Venue not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, capacity } = req.body;
        await pool.query('UPDATE venues SET name = ?, address = ?, capacity = ? WHERE id = ?', [name, address, capacity, id]);
        res.json({ message: 'Venue updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteVenue = async (req, res) => {
    try {
        await pool.query('DELETE FROM venues WHERE id = ?', [req.params.id]);
        res.json({ message: 'Venue deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
