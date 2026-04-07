const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log("Seeding data with 4-digit IDs...");

    // 1. Create Admin User (id 1000)
    const adminEmail = "admin@gmail.com";
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await connection.query(
      "INSERT IGNORE INTO users (id, email, password_hash, full_name, role) VALUES (1000, ?, ?, ?, ?)",
      [adminEmail, hashedPassword, "System Admin", "admin"],
    );

    // 2. Create a Venue (AUTO_INCREMENT starting at 1000)
    const [venueResult] = await connection.query(
      "INSERT INTO venues (name, address, capacity) VALUES (?, ?, ?)",
      ["Grand Convention Center", "123 Tech Street, Cebu City", 500],
    );
    const venueId = venueResult.insertId;

    // 3. Create a Category (AUTO_INCREMENT starting at 1000)
    const [catResult] = await connection.query(
      "INSERT INTO categories (name) VALUES (?)",
      ["Technology"],
    );
    const catId = catResult.insertId;

    // 4. Create an Event (AUTO_INCREMENT starting at 1000)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endWeek = new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000);

    await connection.query(
      "INSERT INTO events (title, description, start_time, end_time, price, capacity, organizer_id, venue_id, category_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        "Sample Tech Conference 2026",
        "A great event about modern web development.",
        nextWeek,
        endWeek,
        150.0,
        200,
        1000, // Admin ID
        venueId,
        catId,
        "published",
      ],
    );

    console.log("SUCCESS: Sample data seeded!");
    console.log(`Venue ID: ${venueId}, Category ID: ${catId}`);
    console.log("Login with: admin@gmail.com / admin123");
  } catch (err) {
    console.error("Error seeding data:", err.message);
  } finally {
    await connection.end();
  }
}

seed();
