const BASE_URL = 'http://localhost:3000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
    // Events
    async getEvents() { return (await fetch(`${BASE_URL}/events`)).json(); },
    async getEventAttendees(id) { return (await fetch(`${BASE_URL}/events/${id}/attendees`, { headers: getAuthHeaders() })).json(); },
    async createEvent(formData) { return (await fetch(`${BASE_URL}/events`, { method: 'POST', headers: getAuthHeaders(), body: formData })).json(); },
    async updateEvent(id, formData) { return (await fetch(`${BASE_URL}/events/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: formData })).json(); },
    async deleteEvent(id) { return (await fetch(`${BASE_URL}/events/${id}`, { method: 'DELETE', headers: getAuthHeaders() })).json(); },

    // Users
    async login(email, password) {
        const res = await fetch(`${BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (data.token) { localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); }
        return data;
    },
    async register(userData) { return (await fetch(`${BASE_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData) })).json(); },
    async updateProfile(id, data) { return (await fetch(`${BASE_URL}/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) })).json(); },
    async getUsers() { return (await fetch(`${BASE_URL}/users`, { headers: getAuthHeaders() })).json(); },
    async deleteUser(id) { return (await fetch(`${BASE_URL}/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() })).json(); },
    async logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); },
    getUser() { const user = localStorage.getItem('user'); return user ? JSON.parse(user) : null; },

    // Bookings
    async createBooking(data) { return (await fetch(`${BASE_URL}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) })).json(); },
    async updateBooking(id, data) { return (await fetch(`${BASE_URL}/bookings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) })).json(); },
    async cancelBooking(id) { return (await fetch(`${BASE_URL}/bookings/${id}/cancel`, { method: 'PUT', headers: getAuthHeaders() })).json(); },
    async deleteBooking(id) { return (await fetch(`${BASE_URL}/bookings/${id}`, { method: 'DELETE', headers: getAuthHeaders() })).json(); },
    async toggleCheckIn(id) { return (await fetch(`${BASE_URL}/bookings/${id}/check-in`, { method: 'PUT', headers: getAuthHeaders() })).json(); },
    async exportAttendeesCSV(eventId) {
        const res = await fetch(`${BASE_URL}/bookings/event/${eventId}/export`, { headers: getAuthHeaders() });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `attendees-${eventId}.csv`; a.click();
    },
    async getUserBookings(userId) { return (await fetch(`${BASE_URL}/bookings/user/${userId}`, { headers: getAuthHeaders() })).json(); },
    async getAllBookings() { return (await fetch(`${BASE_URL}/bookings/admin/all`, { headers: getAuthHeaders() })).json(); },
    async downloadTicket(id) {
        const res = await fetch(`${BASE_URL}/bookings/${id}/ticket`, { headers: getAuthHeaders() });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `ticket-${id}.pdf`; a.click();
    },

    // Venues
    async getVenues() { return (await fetch(`${BASE_URL}/venues`)).json(); },
    async createVenue(data) { return (await fetch(`${BASE_URL}/venues`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) })).json(); },
    async deleteVenue(id) { return (await fetch(`${BASE_URL}/venues/${id}`, { method: 'DELETE', headers: getAuthHeaders() })).json(); },

    // Categories
    async getCategories() { return (await fetch(`${BASE_URL}/categories`)).json(); },
    async createCategory(data) { return (await fetch(`${BASE_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) })).json(); },
    async deleteCategory(id) { return (await fetch(`${BASE_URL}/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() })).json(); },

    // Tasks
    async getTasks(eventId) { return (await fetch(`${BASE_URL}/tasks/event/${eventId}`, { headers: getAuthHeaders() })).json(); },
    async createTask(data) { return (await fetch(`${BASE_URL}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(data) })).json(); },
    async toggleTask(id) { return (await fetch(`${BASE_URL}/tasks/${id}/toggle`, { method: 'PUT', headers: getAuthHeaders() })).json(); },
    async deleteTask(id) { return (await fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE', headers: getAuthHeaders() })).json(); }
};
