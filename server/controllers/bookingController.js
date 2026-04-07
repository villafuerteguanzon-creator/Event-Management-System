const pool = require('../config/db');

exports.createBooking = async (req, res) => {
    try {
        const { user_id, event_id, ticket_count } = req.body;
        
        // Check event capacity
        const [eventRows] = await pool.query('SELECT capacity FROM events WHERE id = ?', [event_id]);
        if (eventRows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        const event = eventRows[0];
        const [bookingRows] = await pool.query('SELECT SUM(ticket_count) as total_booked FROM bookings WHERE event_id = ? AND status != "cancelled"', [event_id]);
        const totalBooked = bookingRows[0].total_booked || 0;
        
        if (totalBooked + ticket_count > event.capacity) {
            return res.status(400).json({ error: 'Not enough tickets available' });
        }

        const [result] = await pool.query(
            'INSERT INTO bookings (user_id, event_id, ticket_count, status) VALUES (?, ?, ?, ?)',
            [user_id, event_id, ticket_count, 'confirmed']
        );
        
        res.status(201).json({ message: 'Booking confirmed successfully', bookingId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query(`
            SELECT b.*, e.title as event_title, e.start_time, v.name as venue_name
            FROM bookings b
            JOIN events e ON b.event_id = e.id
            LEFT JOIN venues v ON e.venue_id = v.id
            WHERE b.user_id = ?
        `, [userId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT b.*, e.title as event_title, u.full_name as user_name
            FROM bookings b
            JOIN events e ON b.event_id = e.id
            JOIN users u ON b.user_id = u.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

exports.generateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT b.*, e.title as event_title, e.start_time, e.description, u.full_name as user_name, v.name as venue_name, v.address as venue_address
            FROM bookings b
            JOIN events e ON b.event_id = e.id
            JOIN users u ON b.user_id = u.id
            LEFT JOIN venues v ON e.venue_id = v.id
            WHERE b.id = ?
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
        const booking = rows[0];

        // Generate QR Code as Data URL
        const qrData = JSON.stringify({ bookingId: booking.id, event: booking.event_title, attendee: booking.user_name });
        const qrImage = await QRCode.toDataURL(qrData);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket-${id}.pdf`);
        doc.pipe(res);

        // Styling the PDF
        doc.rect(0, 0, 612, 100).fill('#2c3e50'); // Header bar
        doc.fillColor('#ffffff').fontSize(25).text('OFFICIAL EVENT TICKET', 50, 40, { align: 'center' });
        
        doc.fillColor('#333333').moveDown(4);
        doc.fontSize(22).text(booking.event_title, { underline: true });
        doc.moveDown(1);
        doc.fontSize(14).text(`Date: ${new Date(booking.start_time).toLocaleString()}`);
        doc.text(`Venue: ${booking.venue_name || 'TBD'}`);
        doc.text(`Address: ${booking.venue_address || 'N/A'}`);
        doc.moveDown(1);
        doc.text(`Attendee: ${booking.user_name}`);
        doc.text(`Tickets: ${booking.ticket_count}`);
        doc.text(`Status: ${booking.status.toUpperCase()}`);

        // Add QR Code
        doc.image(qrImage, 400, 150, { width: 150 });
        doc.fontSize(10).text('Scan for check-in verification', 410, 310);

        doc.moveDown(10);
        doc.fontSize(10).fillColor('#777777').text(`Booking ID: ${booking.id}`, { align: 'center' });
        doc.text('© 2026 Event Management System. No refunds.', { align: 'center' });

        doc.end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [id]);
        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.toggleCheckIn = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT is_checked_in FROM bookings WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
        
        const newValue = !rows[0].is_checked_in;
        await pool.query('UPDATE bookings SET is_checked_in = ? WHERE id = ?', [newValue, id]);
        res.json({ message: `Attendee ${newValue ? 'checked in' : 'unchecked'}`, is_checked_in: newValue });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.exportAttendeesCSV = async (req, res) => {
    try {
        const { eventId } = req.params;
        const [rows] = await pool.query(`
            SELECT u.full_name, u.email, b.ticket_count, b.status, b.is_checked_in, b.booked_at
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE b.event_id = ? AND b.status != 'cancelled'
        `, [eventId]);

        let csv = 'Full Name,Email,Tickets,Status,Checked In,Booked At\n';
        rows.forEach(r => {
            csv += `"${r.full_name}","${r.email}",${r.ticket_count},"${r.status}",${r.is_checked_in ? 'Yes' : 'No'},"${new Date(r.booked_at).toLocaleString()}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendees-${eventId}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { ticket_count } = req.body;
        
        // Get existing booking and event details
        const [bookingRows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
        if (bookingRows.length === 0) return res.status(404).json({ error: 'Booking not found' });
        const booking = bookingRows[0];
        
        const [eventRows] = await pool.query('SELECT capacity FROM events WHERE id = ?', [booking.event_id]);
        const event = eventRows[0];
        
        // Calculate total booked for this event, excluding current booking
        const [totalBookedRows] = await pool.query('SELECT SUM(ticket_count) as total_booked FROM bookings WHERE event_id = ? AND id != ? AND status != "cancelled"', [booking.event_id, id]);
        const totalBooked = totalBookedRows[0].total_booked || 0;
        
        if (totalBooked + ticket_count > event.capacity) {
            return res.status(400).json({ error: 'Not enough tickets available' });
        }
        
        await pool.query('UPDATE bookings SET ticket_count = ? WHERE id = ?', [ticket_count, id]);
        res.json({ message: 'Booking updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
