const mysql = require('mysql2/promise');
require('dotenv').config();

const eventsData = [
  { title: "Coachella Valley Music and Arts Festival", location: "Indio, California, USA", start: "2024-04-12 12:00:00", end: "2024-04-14 12:00:00" },
  { title: "Glastonbury Festival", location: "Pilton, England, UK", start: "2024-06-26 15:00:00", end: "2024-06-30 15:00:00" },
  { title: "Lollapalooza", location: "Chicago, Illinois, USA", start: "2024-08-01 14:00:00", end: "2024-08-04 14:00:00" },
  { title: "Austin City Limits Music Festival", location: "Austin, Texas, USA", start: "2024-10-04 18:00:00", end: "2024-10-06 18:00:00" },
  { title: "Tomorrowland", location: "Boom, Belgium", start: "2024-07-18 13:00:00", end: "2024-07-21 13:00:00" },
  { title: "Life Is Beautiful Festival", location: "Las Vegas, Nevada, USA", start: "2024-09-20 16:00:00", end: "2024-09-22 16:00:00" },
  { title: "Ultra Music Festival", location: "Miami, Florida, USA", start: "2024-04-05 17:00:00", end: "2024-04-07 17:00:00" },
  { title: "Summer Sonic Festival", location: "Tokyo, Japan", start: "2024-08-10 15:00:00", end: "2024-08-11 15:00:00" },
  { title: "Roskilde Festival", location: "Roskilde, Denmark", start: "2024-07-05 14:00:00", end: "2024-07-07 14:00:00" },
  { title: "Music Midtown", location: "Atlanta, Georgia, USA", start: "2024-09-27 18:00:00", end: "2024-09-29 18:00:00" },
  { title: "EDC Las Vegas", location: "Las Vegas, USA", start: "2024-03-15 12:00:00", end: "2024-03-17 12:00:00" },
  { title: "Reading Festival", location: "Reading, England, UK", start: "2024-08-23 13:00:00", end: "2024-08-25 13:00:00" },
  { title: "Leeds Festival", location: "Leeds, England, UK", start: "2024-08-23 13:00:00", end: "2024-08-25 13:00:00" },
  { title: "Austin City Limits Music Festival (W2)", location: "Zilker Park, Austin, USA", start: "2024-10-03 10:00:00", end: "2024-10-05 10:00:00" },
  { title: "Lollapalooza Brazil", location: "São Paulo, Brazil", start: "2024-11-08 17:00:00", end: "2024-11-10 17:00:00" },
  { title: "Ati-Atihan Festival", location: "Kalibo, Aklan", start: "2024-01-21 16:00:00", end: "2024-01-21 23:59:00" },
  { title: "Sinulog Festival", location: "Cebu City", start: "2024-01-14 15:00:00", end: "2024-01-14 23:59:00" },
  { title: "Pahiyas Festival", location: "Lucban, Quezon", start: "2024-05-15 14:00:00", end: "2024-05-15 23:59:00" },
  { title: "Panagbenga Festival", location: "Baguio City", start: "2024-02-25 17:00:00", end: "2024-02-25 23:59:00" },
  { title: "MassKara Festival", location: "Bacolod City", start: "2024-10-20 18:00:00", end: "2024-10-20 23:59:00" },
  { title: "Mad Cool Festival", location: "Madrid, Spain", start: "2024-07-11 12:00:00", end: "2024-07-14 12:00:00" },
  { title: "Primavera Sound", location: "Barcelona, Spain", start: "2024-06-07 14:00:00", end: "2024-06-09 14:00:00" },
  { title: "Parklife Festival", location: "Manchester, UK", start: "2024-06-14 13:00:00", end: "2024-06-16 13:00:00" },
  { title: "Burning Man", location: "Nevada, USA", start: "2024-08-29 17:00:00", end: "2024-09-02 17:00:00" },
  { title: "Ultra Europe", location: "Split, Croatia", start: "2024-07-25 15:00:00", end: "2024-07-28 15:00:00" },
  { title: "Coachella (W2)", location: "Indio, California, USA", start: "2024-04-19 16:00:00", end: "2024-04-21 16:00:00" },
  { title: "Hurricane Festival", location: "Scheeßel, Germany", start: "2024-06-20 14:00:00", end: "2024-06-23 14:00:00" },
  { title: "Southside Festival", location: "Neuhausen ob Eck, Germany", start: "2024-06-20 14:00:00", end: "2024-06-23 14:00:00" },
  { title: "Sziget Festival", location: "Budapest, Hungary", start: "2024-08-07 12:00:00", end: "2024-08-11 12:00:00" },
  { title: "Lollapalooza Paris", location: "Paris, France", start: "2024-07-19 15:00:00", end: "2024-07-21 15:00:00" },
  { title: "Oktoberfest", location: "Munich, Germany", start: "2024-10-12 18:00:00", end: "2024-10-12 23:59:00" },
  { title: "Sydney New Year's Eve Fireworks", location: "Sydney, Australia", start: "2024-12-31 20:00:00", end: "2024-12-31 23:59:59" },
  { title: "Rio Carnival", location: "Rio de Janeiro, Brazil", start: "2024-03-10 17:00:00", end: "2024-03-10 23:59:00" },
  { title: "Venice Carnival", location: "Venice, Italy", start: "2024-02-10 18:00:00", end: "2024-02-10 23:59:00" },
  { title: "New Year's Day", location: "Tokyo, Japan", start: "2024-01-01 19:00:00", end: "2024-01-01 23:59:00" },
  { title: "Songkran Festival", location: "Bangkok, Thailand", start: "2024-04-13 16:00:00", end: "2024-04-13 23:59:00" },
  { title: "St. Patrick's Day", location: "Dublin, Ireland", start: "2024-03-17 17:00:00", end: "2024-03-17 23:59:00" },
  { title: "Halloween", location: "USA (nationwide)", start: "2024-10-31 18:00:00", end: "2024-10-31 23:59:00" },
  { title: "Christmas", location: "Worldwide", start: "2024-12-25 19:00:00", end: "2024-12-25 23:59:00" },
  { title: "Valentine's Day", location: "Worldwide", start: "2024-02-14 18:00:00", end: "2024-02-14 23:59:00" },
  { title: "Running of the Bulls", location: "Pamplona, Spain", start: "2024-07-06 15:00:00", end: "2024-07-06 23:59:00" },
  { title: "King's Day", location: "Amsterdam, Netherlands", start: "2024-04-27 17:00:00", end: "2024-04-27 23:59:00" },
  { title: "Notting Hill Carnival", location: "Notting Hill, London", start: "2024-08-24 14:00:00", end: "2024-08-24 23:59:00" },
  { title: "Guy Fawkes Night", location: "UK", start: "2024-11-05 18:00:00", end: "2024-11-05 23:59:00" },
  { title: "Oktoberfest (Start)", location: "Munich, Germany", start: "2024-09-16 12:00:00", end: "2024-09-16 23:59:00" },
  { title: "International Women's Day", location: "Worldwide", start: "2024-03-08 17:00:00", end: "2024-03-08 23:59:00" },
  { title: "World Environment Day", location: "Worldwide", start: "2024-06-05 09:00:00", end: "2024-06-05 23:59:00" },
  { title: "Earth Day", location: "Worldwide", start: "2024-04-22 10:00:00", end: "2024-04-22 23:59:00" },
  { title: "Fête de la Musique", location: "Paris, France", start: "2024-06-21 20:00:00", end: "2024-06-21 23:59:59" },
  { title: "Independence Day", location: "USA", start: "2024-07-04 18:00:00", end: "2024-07-04 23:59:00" }
];

async function seedRyanEvents() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        console.log('Seeding Ryan\'s events...');

        // Get Ryan's ID
        const [users] = await conn.query('SELECT id FROM users WHERE email = ?', ['Ryan@gmail.com']);
        if (users.length === 0) throw new Error('Ryan not found');
        const ryanId = users[0].id;

        // Get or Create "Featured" Category
        let [cats] = await conn.query('SELECT id FROM categories WHERE name = ?', ['Music & Arts']);
        let catId;
        if (cats.length === 0) {
            const [res] = await conn.query('INSERT INTO categories (name) VALUES (?)', ['Music & Arts']);
            catId = res.insertId;
        } else catId = cats[0].id;

        // Create events
        for (const e of eventsData) {
            // Create a specific venue for each location if not exists
            let [venues] = await conn.query('SELECT id FROM venues WHERE name = ?', [e.location]);
            let venueId;
            if (venues.length === 0) {
                const [res] = await conn.query('INSERT INTO venues (name, address, capacity) VALUES (?, ?, ?)', [e.location, e.location, 10000]);
                venueId = res.insertId;
            } else venueId = venues[0].id;

            await conn.query(
                'INSERT INTO events (title, description, start_time, end_time, price, capacity, organizer_id, venue_id, category_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    e.title,
                    `Global event: ${e.title} taking place at ${e.location}`,
                    e.start,
                    e.end,
                    0.00,
                    10000,
                    ryanId,
                    venueId,
                    catId,
                    'published'
                ]
            );
        }

        console.log(`Successfully added ${eventsData.length} events for Ryan@gmail.com`);
    } catch (err) {
        console.error('Error seeding:', err.message);
    } finally {
        await conn.end();
    }
}

seedRyanEvents();
