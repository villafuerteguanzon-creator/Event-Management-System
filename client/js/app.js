import { api } from './api.js';

let allEvents = [];
let dashboardEvents = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Initial UI Setup
    updateNav();
    await loadEvents();
    
    // Listeners
    setupAuthListeners();
    setupModalListeners();
    setupFilterListeners();
    setupSidebarListeners();
    
    // Initial Route Check
    checkDashboard();
});

// --- UI Navigation & Routing ---

function updateNav() {
    const authLinks = document.getElementById('auth-links');
    if (!authLinks) return;

    const user = api.getUser();
    if (user) {
        authLinks.innerHTML = `
            <span style="margin-right: 15px; color: #cbd5e1; font-weight: 500;">Hi, ${user.full_name.split(' ')[0]}</span>
            <a href="#" id="nav-dashboard" class="btn-primary" style="width: auto; padding: 0.5rem 1rem;">Dashboard</a>
        `;
        document.getElementById('nav-dashboard').onclick = (e) => { 
            e.preventDefault(); 
            showDashboard(); 
        };

        const manageLi = document.getElementById('side-nav-manage-events-li');
        if (manageLi && (user.role === 'admin' || user.role === 'organizer')) {
            manageLi.style.display = 'block';
        }

        const logoutBtn = document.getElementById('logout-link-side');
        if (logoutBtn) {
            logoutBtn.onclick = (e) => { 
                e.preventDefault(); 
                api.logout(); 
                window.location.hash = '';
                location.reload(); 
            };
        }
    }
}

function hideAllSections() {
    const sections = ['home-view', 'dashboard-view', 'dashboard-overview', 'events-management-dashboard'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function showHome() {
    hideAllSections();
    const home = document.getElementById('home-view');
    if (home) home.style.display = 'block';
    window.location.hash = '';
}

async function showDashboard() {
    const user = api.getUser();
    if (!user) {
        showAuthForm('login');
        return;
    }
    
    if (allEvents.length === 0) await loadEvents();
    
    window.location.hash = 'dashboard';
    hideAllSections();
    
    const dashView = document.getElementById('dashboard-view');
    const dashOverview = document.getElementById('dashboard-overview');
    if (dashView) dashView.style.display = 'flex';
    if (dashOverview) dashOverview.style.display = 'block';
    
    setActiveSidebarLink('side-nav-overview');
    
    const content = document.getElementById('dashboard-content');
    if (content) {
        content.innerHTML = '<div style="text-align: center; padding: 3rem;"><p>Loading insights...</p></div>';
        if (user.role === 'admin') renderAdminDashboard(content); 
        else if (user.role === 'organizer') renderOrganizerDashboard(content, user.id);
        else renderUserDashboard(content, user.id);
    }
}

async function showEventsDashboard() {
    const user = api.getUser();
    if (!user || (user.role !== 'admin' && user.role !== 'organizer')) return;
    
    window.location.hash = 'manage-events';
    hideAllSections();
    
    const dashView = document.getElementById('dashboard-view');
    const manageSection = document.getElementById('events-management-dashboard');
    if (dashView) dashView.style.display = 'flex';
    if (manageSection) manageSection.style.display = 'block';
    
    setActiveSidebarLink('side-nav-manage-events');
    
    const [events, venues, categories] = await Promise.all([api.getEvents(), api.getVenues(), api.getCategories()]);
    dashboardEvents = user.role === 'admin' ? events : events.filter(e => e.organizer_id === user.id);
    
    renderEventsManagementGrid(dashboardEvents, venues, categories);
    
    const addBtn = document.getElementById('btn-add-event-dashboard');
    if (addBtn) addBtn.onclick = () => openEventModal(null, venues, categories);
    
    const manageSearch = document.getElementById('manage-search-input');
    if (manageSearch) {
        manageSearch.oninput = () => {
            const term = manageSearch.value.toLowerCase();
            const filtered = dashboardEvents.filter(e => (e.title || '').toLowerCase().includes(term) || (e.description || '').toLowerCase().includes(term));
            renderEventsManagementGrid(filtered, venues, categories);
        };
    }
}

function setActiveSidebarLink(id) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const link = document.getElementById(id);
    if (link) link.classList.add('active');
}

function setupSidebarListeners() {
    const overviewLink = document.getElementById('side-nav-overview');
    const manageLink = document.getElementById('side-nav-manage-events');
    const logo = document.querySelector('.logo');

    if (overviewLink) overviewLink.onclick = (e) => { e.preventDefault(); showDashboard(); };
    if (manageLink) manageLink.onclick = (e) => { e.preventDefault(); showEventsDashboard(); };
    if (logo) logo.onclick = () => showHome();
}

// --- Data Loading & Rendering ---

async function loadEvents() {
    try {
        const [events, categories] = await Promise.all([api.getEvents(), api.getCategories()]);
        allEvents = events;
        
        const filter = document.getElementById('category-filter');
        if (filter) {
            filter.innerHTML = '<option value="">All Categories</option>' + 
                categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
        
        renderEventList(allEvents.filter(e => e.status === 'published'));
        
        const user = api.getUser();
        if (user) await loadMyBookingsHome(user.id);
    } catch (e) { console.error("Error loading events:", e); }
}

async function loadMyBookingsHome(userId) {
    try {
        const bookings = await api.getUserBookings(userId);
        const upcoming = bookings.filter(b => new Date(b.start_time) >= new Date() && b.status !== 'cancelled');
        const bookingHome = document.getElementById('my-bookings-home');
        if (upcoming.length > 0 && bookingHome) {
            bookingHome.style.display = 'block';
            renderMyBookingsHome(upcoming);
        }
    } catch (e) { console.error(e); }
}

function renderMyBookingsHome(bookings) {
    const container = document.getElementById('my-booking-list-home');
    if (!container) return;
    container.innerHTML = bookings.map(b => `
        <div class="event-card" style="border-left: 4px solid var(--secondary);">
            <div class="event-info">
                <span class="badge badge-available" style="align-self: flex-start; margin-bottom: 0.5rem;">Confirmed</span>
                <h3>${b.event_title}</h3>
                <p><strong><i class="fas fa-calendar"></i> Date:</strong> ${new Date(b.start_time).toLocaleDateString()}</p>
                <p><strong><i class="fas fa-ticket-alt"></i> Tickets:</strong> ${b.ticket_count}</p>
            </div>
        </div>
    `).join('');
}

async function renderEventList(events) {
    const container = document.getElementById('event-list');
    if (!container) return;
    
    let allBookings = [];
    const user = api.getUser();
    if (user) {
        try {
            const res = await api.getAllBookings();
            if (Array.isArray(res)) allBookings = res;
        } catch (e) { console.warn("Could not load bookings:", e); }
    }

    container.innerHTML = events.map(event => {
        const sold = allBookings.filter(b => b.event_id === event.id && b.status !== 'cancelled').reduce((s, b) => s + b.ticket_count, 0);
        const percent = Math.min(100, (sold / event.capacity) * 100);
        const isSoldOut = sold >= event.capacity;

        return `
            <div class="event-card">
                <div class="event-image" style="background: url('${event.image_url ? 'http://localhost:3000' + event.image_url : 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400&q=80'}') center/cover">
                    ${isSoldOut ? '<span class="badge badge-sold-out" style="position:absolute; margin:1rem;">Sold Out</span>' : ''}
                </div>
                <div class="event-info">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
                        <h3 style="margin-bottom: 0;">${event.title}</h3>
                        <span class="badge ${isSoldOut ? 'badge-sold-out' : 'badge-available'}" style="white-space: nowrap; margin-left: 10px;">$${event.price}</span>
                    </div>
                    <p><i class="fas fa-calendar"></i> ${new Date(event.start_time).toLocaleDateString()} | <i class="fas fa-map-marker-alt"></i> ${event.venue_name || 'TBD'}</p>
                    <div class="progress-container"><div class="progress-bar" style="width: ${percent}%"></div></div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1rem;">
                        <span>${sold} sold</span>
                        <span>Cap: ${event.capacity}</span>
                    </div>
                    <button class="btn-primary open-booking" style="margin-top:auto;" data-id="${event.id}" data-title="${event.title}" ${isSoldOut ? 'disabled' : ''}>
                        ${isSoldOut ? 'Sold Out' : 'Book Now'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.open-booking').forEach(btn => btn.onclick = () => openModal(btn.dataset.id, btn.dataset.title));
}

// --- Dashboards ---

async function renderAdminDashboard(container) {
    try {
        const [bookings, events, venues, categories, users] = await Promise.all([
            api.getAllBookings(), api.getEvents(), api.getVenues(), api.getCategories(), api.getUsers()
        ]);
        document.getElementById('dashboard-title').innerText = 'Platform Administration';
        const totalRevenue = bookings.reduce((sum, b) => b.status !== 'cancelled' ? sum + (parseFloat(events.find(e => e.id === b.event_id)?.price || 0) * b.ticket_count) : sum, 0);

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><h4>Events</h4><div class="value">${events.length}</div></div>
                <div class="stat-card"><h4>Bookings</h4><div class="value">${bookings.length}</div></div>
                <div class="stat-card"><h4>Users</h4><div class="value">${users.length}</div></div>
                <div class="stat-card"><h4>Revenue</h4><div class="value">$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div></div>
            </div>
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-top: 2rem;">
                <div>
                    <h3>Recent Bookings</h3>
                    <table class="admin-table">
                        <thead><tr><th>User</th><th>Event</th><th>Tickets</th><th>Status</th></tr></thead>
                        <tbody>${bookings.slice(0, 5).map(b => `
                            <tr>
                                <td>${b.user_name}</td>
                                <td>${b.event_title}</td>
                                <td>${b.ticket_count}</td>
                                <td><span class="badge" style="background: ${b.status === 'confirmed' ? 'var(--success)' : 'var(--accent)'}; color: white;">${b.status}</span></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div>
                    <h3>Quick Stats</h3>
                    <div style="background: white; border-radius: 1rem; padding: 1rem; border: 1px solid var(--border);">
                        <p><strong>Top Venues:</strong> ${venues.length}</p>
                        <p><strong>Categories:</strong> ${categories.length}</p>
                    </div>
                </div>
            </div>
        `;
    } catch (e) { console.error(e); }
}

async function renderOrganizerDashboard(container, organizerId) {
    try {
        const [allEvents, allBookings, venues, categories] = await Promise.all([
            api.getEvents(), api.getAllBookings(), api.getVenues(), api.getCategories()
        ]);
        const events = allEvents.filter(e => e.organizer_id === organizerId);
        const user = api.getUser();
        document.getElementById('dashboard-title').innerText = 'Organizer Dashboard';
        
        const myBookings = allBookings.filter(b => events.some(e => e.id === b.event_id));
        const totalSales = myBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.ticket_count, 0);

        container.innerHTML = `
            <div style="margin-bottom: 2rem; padding: 1rem; background: white; border-radius: 0.75rem; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div><h3 style="font-size: 1rem; margin: 0;">${user.full_name} (Organizer)</h3><p style="font-size: 0.875rem; color: var(--text-muted); margin: 0;">${user.email}</p></div>
                <button id="btn-edit-profile-mini" class="btn-primary" style="width: auto; padding: 0.5rem 1rem; font-size: 0.75rem; background: transparent; color: var(--secondary); border: 1px solid var(--secondary);">Edit Profile</button>
            </div>
            <div id="minimal-profile-form" style="display: none; margin-bottom: 2rem; padding: 1.5rem; background: white; border-radius: 0.75rem; border: 1px solid var(--border);">
                <form id="profile-form">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group"><label style="font-size: 0.75rem;">Full Name</label><input type="text" id="p-name" value="${user.full_name}" required></div>
                        <div class="form-group"><label style="font-size: 0.75rem;">Email Address</label><input type="text" value="${user.email}" disabled style="background: #f8fafc;"></div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button type="submit" class="btn-primary" style="width: auto; padding: 0.5rem 1rem; font-size: 0.875rem;">Save Changes</button>
                        <button type="button" id="btn-cancel-profile" class="btn-primary" style="width: auto; padding: 0.5rem 1rem; font-size: 0.875rem; background: #f1f5f9; color: var(--text-main);">Cancel</button>
                    </div>
                </form>
            </div>
            <div class="stats-grid">
                <div class="stat-card"><h4>My Events</h4><div class="value">${events.length}</div></div>
                <div class="stat-card"><h4>Tickets Sold</h4><div class="value">${totalSales}</div></div>
                <div class="stat-card"><h4>Upcoming</h4><div class="value">${events.filter(e => new Date(e.start_time) >= new Date()).length}</div></div>
            </div>
            <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Upcoming Events</h3>
            <div class="grid-container" style="grid-template-columns: 1fr;">
                ${events.filter(e => new Date(e.start_time) >= new Date()).map(e => {
                    const sold = allBookings.filter(b => b.event_id === e.id && b.status !== 'cancelled').reduce((s,b)=>s+b.ticket_count,0);
                    const percent = Math.min(100, (sold / e.capacity) * 100);
                    return `
                        <div class="event-card" style="flex-direction: row; padding: 1.5rem; align-items: center; background: white; border: 1px solid var(--border);">
                            <div style="flex-grow: 1;">
                                <h4 style="margin:0; font-size: 1.125rem;">${e.title}</h4>
                                <div style="display: flex; gap: 1rem; margin-top: 0.25rem;">
                                    <p style="margin: 0; font-size: 0.875rem; color: var(--text-muted);"><i class="fas fa-calendar"></i> ${new Date(e.start_time).toLocaleDateString()}</p>
                                    <p style="margin: 0; font-size: 0.875rem; color: var(--text-muted);"><i class="fas fa-ticket-alt"></i> ${sold} / ${e.capacity} Sold</p>
                                </div>
                                <div class="progress-container" style="max-width: 200px; margin: 0.5rem 0 0;"><div class="progress-bar" style="width: ${percent}%;"></div></div>
                            </div>
                            <div style="display: flex; gap: 0.75rem;">
                                <button class="btn-primary btn-manage-edit" data-id="${e.id}" style="width:auto; padding: 0.625rem 1.25rem; font-size: 0.875rem; background: #f8fafc; color: var(--secondary); border: 1px solid #e2e8f0;">Edit</button>
                                <button class="btn-primary btn-manage-attendees" data-id="${e.id}" style="width:auto; padding: 0.625rem 1.25rem; font-size: 0.875rem; background: #f8fafc; color: var(--primary); border: 1px solid #e2e8f0;">Attendees</button>
                            </div>
                        </div>
                    `;
                }).join('')}
                ${events.length === 0 ? '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No events created yet.</p>' : ''}
            </div>
        `;
        setupDashboardProfileListeners(user);
        container.querySelectorAll('.btn-manage-edit').forEach(btn => btn.onclick = () => openEventModal(events.find(e => e.id === btn.dataset.id), venues, categories));
        container.querySelectorAll('.btn-manage-attendees').forEach(btn => btn.onclick = async () => {
            const attendees = await api.getEventAttendees(btn.dataset.id);
            const event = events.find(e => e.id === btn.dataset.id);
            alert(`Attendees for ${event.title}:\n` + (attendees.length > 0 ? attendees.map(a => `- ${a.full_name} (${a.email})`).join('\n') : "No attendees yet."));
        });
    } catch (e) { console.error(e); }
}

async function renderUserDashboard(container, userId) {
    try {
        const bookings = await api.getUserBookings(userId);
        const user = api.getUser();
        document.getElementById('dashboard-title').innerText = 'My Dashboard';
        const upcoming = bookings.filter(b => new Date(b.start_time) >= new Date() && b.status !== 'cancelled');
        
        container.innerHTML = `
            <div style="margin-bottom: 2rem; padding: 1rem; background: white; border-radius: 0.75rem; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div><h3 style="font-size: 1rem; margin: 0;">${user.full_name}</h3><p style="font-size: 0.875rem; color: var(--text-muted); margin: 0;">${user.email}</p></div>
                <button id="btn-edit-profile-mini" class="btn-primary" style="width: auto; padding: 0.5rem 1rem; font-size: 0.75rem; background: transparent; color: var(--secondary); border: 1px solid var(--secondary);">Edit Profile</button>
            </div>
            <div id="minimal-profile-form" style="display: none; margin-bottom: 2rem; padding: 1.5rem; background: white; border-radius: 0.75rem; border: 1px solid var(--border);">
                <form id="profile-form">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group"><label style="font-size: 0.75rem;">Full Name</label><input type="text" id="p-name" value="${user.full_name}" required></div>
                        <div class="form-group"><label style="font-size: 0.75rem;">Email Address</label><input type="text" value="${user.email}" disabled style="background: #f8fafc;"></div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button type="submit" class="btn-primary" style="width: auto; padding: 0.5rem 1rem; font-size: 0.875rem;">Save Changes</button>
                        <button type="button" id="btn-cancel-profile" class="btn-primary" style="width: auto; padding: 0.5rem 1rem; font-size: 0.875rem; background: #f1f5f9; color: var(--text-main);">Cancel</button>
                    </div>
                </form>
            </div>

            <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">My Booked Events</h3>
            <div class="grid-container" style="grid-template-columns: 1fr; margin-bottom: 3rem;">
                ${upcoming.map(b => `
                    <div class="event-card" style="flex-direction: row; padding: 1.5rem; align-items: center; background: white; border: 1px solid var(--border);">
                        <div style="flex-grow: 1;">
                            <h4 style="margin:0; font-size: 1.125rem; color: var(--primary);">${b.event_title}</h4>
                            <p style="margin: 0.25rem 0; font-size: 0.875rem; color: var(--text-muted);"><i class="fas fa-calendar"></i> ${new Date(b.start_time).toLocaleDateString()} at ${new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <div style="display: flex; gap: 0.75rem;">
                            <button class="btn-primary btn-edit-booking" data-id="${b.id}" data-event-id="${b.event_id}" data-title="${b.event_title}" data-count="${b.ticket_count}" style="width:auto; padding: 0.625rem 1.25rem; font-size: 0.875rem; background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;">Edit</button>
                            <button class="btn-primary btn-cancel" data-id="${b.id}" style="width:auto; padding: 0.625rem 1.25rem; font-size: 0.875rem; background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3;">Cancel</button>
                        </div>
                    </div>
                `).join('')}
                ${upcoming.length === 0 ? '<div style="padding: 2rem; text-align: center; background: white; border-radius: 0.75rem; border: 1px dashed var(--border);"><p style="color: var(--text-muted); margin: 0;">You have no active bookings.</p></div>' : ''}
            </div>

            <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Upcoming Featured Events</h3>
            <div id="dash-featured-events" class="grid-container">
                <p>Loading events...</p>
            </div>
        `;
        
        // Setup listeners for booking actions
        container.querySelectorAll('.btn-edit-booking').forEach(btn => btn.onclick = () => {
            openModal(btn.dataset.eventId, btn.dataset.title, btn.dataset.id, btn.dataset.count);
        });
        
        // Render discovery events within dashboard
        const featuredContainer = document.getElementById('dash-featured-events');
        if (featuredContainer) {
            const published = allEvents.filter(e => e.status === 'published' && new Date(e.start_time) >= new Date());
            featuredContainer.innerHTML = published.map(event => `
                <div class="event-card" style="background: white; border: 1px solid var(--border);">
                    <div class="event-image" style="height: 120px; background: url('${event.image_url ? 'http://localhost:3000' + event.image_url : 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400&q=80'}') center/cover"></div>
                    <div class="event-info" style="padding: 1rem;">
                        <h4 style="margin: 0 0 0.5rem; font-size: 1rem;">${event.title}</h4>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1rem;"><i class="fas fa-calendar"></i> ${new Date(event.start_time).toLocaleDateString()}</p>
                        <button class="btn-primary open-booking" data-id="${event.id}" data-title="${event.title}" style="padding: 0.5rem; font-size: 0.75rem;">Book Ticket</button>
                    </div>
                </div>
            `).join('');
            featuredContainer.querySelectorAll('.open-booking').forEach(btn => btn.onclick = () => openModal(btn.dataset.id, btn.dataset.title));
        }

        setupDashboardProfileListeners(user);
        container.querySelectorAll('.btn-cancel').forEach(btn => btn.onclick = async () => { 
            if(confirm('Cancel this booking?')) { 
                const res = await api.cancelBooking(btn.dataset.id); 
                if (res.message) {
                    alert('Booking cancelled successfully!');
                    renderUserDashboard(container, userId); 
                } else {
                    alert(res.error || 'Failed to cancel booking');
                }
            } 
        });
    } catch (e) { console.error(e); }
}

function setupDashboardProfileListeners(user) {
    const editBtn = document.getElementById('btn-edit-profile-mini');
    const cancelBtn = document.getElementById('btn-cancel-profile');
    const formPanel = document.getElementById('minimal-profile-form');
    const form = document.getElementById('profile-form');

    if (editBtn) editBtn.onclick = () => { if (formPanel) formPanel.style.display = 'block'; };
    if (cancelBtn) cancelBtn.onclick = () => { if (formPanel) formPanel.style.display = 'none'; };
    if (form) {
        form.onsubmit = async (e) => { 
            e.preventDefault(); 
            const newName = document.getElementById('p-name').value; 
            const res = await api.updateProfile(user.id, { full_name: newName }); 
            if (res.message) { 
                user.full_name = newName; 
                localStorage.setItem('user', JSON.stringify(user)); 
                alert('Profile updated!'); 
                location.reload(); 
            } 
        };
    }
}

// --- Modals ---

function openModal(eventId, title, bookingId = null, ticketCount = 1) {
    const user = api.getUser();
    if (!user) { showAuthForm('login'); return; }
    
    const modal = document.getElementById('booking-modal');
    if (!modal) return;

    const eidInput = document.getElementById('modal-event-id');
    const bidInput = document.getElementById('modal-booking-id');
    const titleEl = document.getElementById('modal-event-title');
    const countInput = document.getElementById('ticket-count');

    if (eidInput) eidInput.value = eventId || '';
    if (bidInput) bidInput.value = bookingId || '';
    if (titleEl) titleEl.innerText = bookingId ? `Update Booking` : `Book ${title}`;
    if (countInput) countInput.value = ticketCount;
    
    modal.style.display = 'block';
}

function openEventModal(event, venues, categories) {
    const modal = document.getElementById('event-modal');
    if (!modal) return;

    const vSelect = document.getElementById('event-venue-input');
    const cSelect = document.getElementById('event-category-input');
    if (vSelect) vSelect.innerHTML = venues.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
    if (cSelect) cSelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    if (event) {
        document.getElementById('event-id').value = event.id;
        document.getElementById('event-title-input').value = event.title;
        document.getElementById('event-desc-input').value = event.description;
        document.getElementById('event-start-input').value = new Date(event.start_time).toISOString().slice(0, 16);
        document.getElementById('event-end-input').value = new Date(event.end_time).toISOString().slice(0, 16);
        document.getElementById('event-price-input').value = event.price;
        document.getElementById('event-capacity-input').value = event.capacity;
        if (vSelect) vSelect.value = event.venue_id;
        if (cSelect) cSelect.value = event.category_id;
        document.getElementById('event-status-input').value = event.status;
    } else {
        const form = document.getElementById('event-form');
        if (form) form.reset();
        document.getElementById('event-id').value = '';
    }
    modal.style.display = 'block';
}

function setupModalListeners() {
    const closeBooking = document.querySelector('.close');
    const closeAuth = document.querySelector('.close-auth');
    const closeEvent = document.querySelector('.close-event');
    const bookingModal = document.getElementById('booking-modal');
    const authModal = document.getElementById('auth-modal');
    const eventModal = document.getElementById('event-modal');

    if (closeBooking) closeBooking.onclick = () => { if (bookingModal) bookingModal.style.display = 'none'; };
    if (closeAuth) closeAuth.onclick = () => { if (authModal) authModal.style.display = 'none'; };
    if (closeEvent) closeEvent.onclick = () => { if (eventModal) eventModal.style.display = 'none'; };
    
    window.onclick = (e) => { 
        if (e.target == bookingModal) bookingModal.style.display = 'none'; 
        if (e.target == authModal) authModal.style.display = 'none'; 
        if (e.target == eventModal) eventModal.style.display = 'none'; 
    };
    
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.onsubmit = async (e) => { 
            e.preventDefault(); 
            const eid = document.getElementById('modal-event-id').value;
            const bid = document.getElementById('modal-booking-id').value;
            const tc = parseInt(document.getElementById('ticket-count').value);
            const res = bid ? await api.updateBooking(bid, { ticket_count: tc }) : await api.createBooking({ user_id: api.getUser().id, event_id: eid, ticket_count: tc });
            if (res.message) { 
                if (bookingModal) bookingModal.style.display = 'none'; 
                alert('Success!'); 
                await loadEvents(); 
                if(window.location.hash === '#dashboard') showDashboard(); 
            } else alert(res.error);
        };
    }

    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.onsubmit = async (e) => { 
            e.preventDefault(); 
            const fd = new FormData(); 
            fd.append('title', document.getElementById('event-title-input').value); 
            fd.append('description', document.getElementById('event-desc-input').value); 
            fd.append('start_time', document.getElementById('event-start-input').value); 
            fd.append('end_time', document.getElementById('event-end-input').value); 
            fd.append('price', document.getElementById('event-price-input').value); 
            fd.append('capacity', document.getElementById('event-capacity-input').value); 
            fd.append('venue_id', document.getElementById('event-venue-input').value); 
            fd.append('category_id', document.getElementById('event-category-input').value); 
            fd.append('status', document.getElementById('event-status-input').value); 
            fd.append('organizer_id', api.getUser().id); 
            const img = document.getElementById('event-image-input').files[0]; 
            if (img) fd.append('image', img); 
            
            const id = document.getElementById('event-id').value; 
            const res = id ? await api.updateEvent(id, fd) : await api.createEvent(fd); 
            if (res.message) { 
                if (eventModal) eventModal.style.display = 'none'; 
                showEventsDashboard(); 
            } else alert(res.error); 
        };
    }
}

// --- Auth ---

function setupAuthListeners() {
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginLink) loginLink.onclick = (e) => { e.preventDefault(); showAuthForm('login'); };
    if (registerLink) registerLink.onclick = (e) => { e.preventDefault(); showAuthForm('register'); };
    if (showRegister) showRegister.onclick = (e) => { e.preventDefault(); showAuthForm('register'); };
    if (showLogin) showLogin.onclick = (e) => { e.preventDefault(); showAuthForm('login'); };
    
    if (loginForm) {
        loginForm.onsubmit = async (e) => { 
            e.preventDefault(); 
            const res = await api.login(document.getElementById('login-email').value, document.getElementById('login-password').value); 
            if (res.token) location.reload(); else alert(res.message); 
        };
    }
    
    if (registerForm) {
        registerForm.onsubmit = async (e) => { 
            e.preventDefault(); 
            const res = await api.register({ 
                full_name: document.getElementById('reg-name').value, 
                email: document.getElementById('reg-email').value, 
                password: document.getElementById('reg-password').value 
            }); 
            if (res.message) { alert('Account created! Please login.'); showAuthForm('login'); } else alert(res.error); 
        };
    }
}

function showAuthForm(t) {
    const modal = document.getElementById('auth-modal');
    const loginCont = document.getElementById('login-form-container');
    const regCont = document.getElementById('register-form-container');
    
    if (modal) modal.style.display = 'block';
    if (loginCont) loginCont.style.display = t === 'login' ? 'block' : 'none';
    if (regCont) regCont.style.display = t === 'register' ? 'block' : 'none';
}

// --- Search & Filters ---

function setupFilterListeners() {
    const search = document.getElementById('search-input');
    const filter = document.getElementById('category-filter');
    const sort = document.getElementById('sort-filter');
    const searchBtn = document.getElementById('search-button');
    
    if (search) search.oninput = filterEvents;
    if (filter) filter.onchange = filterEvents;
    if (sort) sort.onchange = filterEvents;
    if (searchBtn) searchBtn.onclick = filterEvents;
}

function filterEvents() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (!searchInput || !allEvents) return;

    const searchTerm = searchInput.value.toLowerCase();
    const categoryId = categoryFilter ? categoryFilter.value : '';
    const sortBy = sortFilter ? sortFilter.value : 'newest';
    
    let filtered = allEvents.filter(e => {
        const title = (e.title || '').toLowerCase();
        const desc = (e.description || '').toLowerCase();
        const venue = (e.venue_name || '').toLowerCase();
        const category = (e.category_name || '').toLowerCase();
        
        const matchesSearch = title.includes(searchTerm) || 
                             desc.includes(searchTerm) || 
                             venue.includes(searchTerm) ||
                             category.includes(searchTerm);
                             
        const matchesCategory = categoryId === '' || String(e.category_id) === String(categoryId);
        const isPublished = e.status === 'published';
        
        return matchesSearch && matchesCategory && isPublished;
    });

    if (sortBy === 'price-low') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === 'price-high') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.start_time || 0) - new Date(a.start_time || 0));
    
    renderEventList(filtered);
}

function checkDashboard() { 
    if (window.location.hash === '#dashboard') showDashboard(); 
    else if (window.location.hash === '#manage-events') showEventsDashboard();
}

function renderEventsManagementGrid(events, venues, categories) {
    const container = document.getElementById('events-grid-dashboard');
    if (!container) return;

    container.innerHTML = events.map(e => {
        const sold = 0; // Simplified for restore
        const percent = Math.min(100, (sold / e.capacity) * 100);
        return `
            <div class="event-card" style="flex-direction: row; padding: 1.5rem; align-items: center; background: white; border: 1px solid var(--border);">
                <div style="flex-grow: 1;">
                    <h4 style="margin:0; font-size: 1.125rem;">${e.title}</h4>
                    <div style="display: flex; gap: 1rem; margin-top: 0.25rem;">
                        <p style="margin: 0; font-size: 0.875rem; color: var(--text-muted);"><i class="fas fa-calendar"></i> ${new Date(e.start_time).toLocaleDateString()}</p>
                        <p style="margin: 0; font-size: 0.875rem; color: var(--text-muted);"><i class="fas fa-ticket-alt"></i> ${sold} / ${e.capacity} Sold</p>
                    </div>
                    <div class="progress-container" style="max-width: 200px; margin: 0.5rem 0 0;"><div class="progress-bar" style="width: ${percent}%;"></div></div>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn-primary btn-manage-edit" data-id="${e.id}" style="width:auto; padding: 0.625rem 1.25rem; font-size: 0.875rem; background: #f8fafc; color: var(--secondary); border: 1px solid #e2e8f0;">Edit</button>
                    <button class="btn-primary btn-manage-attendees" data-id="${e.id}" style="width:auto; padding: 0.625rem 1.25rem; font-size: 0.875rem; background: #f8fafc; color: var(--primary); border: 1px solid #e2e8f0;">Attendees</button>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.btn-manage-edit').forEach(btn => btn.onclick = () => openEventModal(events.find(ev => ev.id == btn.dataset.id), venues, categories));
}
