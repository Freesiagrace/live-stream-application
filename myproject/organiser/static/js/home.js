// DOM Elements
const addEventBtn = document.getElementById('add-event-btn');
const addEventModal = document.getElementById('add-event-modal');
const editEventModal = document.getElementById('edit-event-modal');
const addModalClose = document.getElementById('add-modal-close');
const editModalClose = document.getElementById('edit-modal-close');
const cancelAddBtn = document.getElementById('cancel-add-event');
const cancelEditBtn = document.getElementById('cancel-edit-event');
const saveEventBtn = document.getElementById('save-event');
const updateEventBtn = document.getElementById('update-event');
const eventsList = document.getElementById('events-list');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Event data will be populated from server
let events = [];

// Function to get the CSRF token from the page
function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

// Event Listeners
addEventBtn.addEventListener('click', openAddEventModal);
addModalClose.addEventListener('click', closeAddEventModal);
editModalClose.addEventListener('click', closeEditEventModal);
cancelAddBtn.addEventListener('click', closeAddEventModal);
cancelEditBtn.addEventListener('click', closeEditEventModal);
saveEventBtn.addEventListener('click', saveEvent);
updateEventBtn.addEventListener('click', updateEvent);

// Initialize the app
function init() {
    // Fetch events from server
    fetchEvents();
}

// Fetch events from server
function fetchEvents() {
    fetch('/organiser/api/events/')
        .then(response => response.json())
        .then(data => {
            events = data.events;
            renderEvents();
        })
        .catch(error => {
            console.error('Error fetching events:', error);
            showToast('Failed to load events', 'error');
        });
}

// Render events to the DOM
function renderEvents() {
    eventsList.innerHTML = '';
    
    if (events.length === 0) {
        eventsList.innerHTML = '<p>No events scheduled. Click "Add New Event" to create one.</p>';
        return;
    }
    
    // Sort events by date and time
    events.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    
    events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.dataset.id = event.id;
        
        eventElement.innerHTML = `
            <div class="event-details">
                <div class="event-title">${event.title}</div>
                <div class="event-time">
                    <i class="fas fa-calendar-alt"></i> ${event.datetime}
                </div>
            </div>
            <div class="event-actions">
                <button class="btn action-btn edit-event" data-id="${event.id}">Edit</button>
                <button class="btn btn-danger action-btn delete-event" data-id="${event.id}">Delete</button>
            </div>
        `;
        
        eventsList.appendChild(eventElement);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-event').forEach(btn => {
        btn.addEventListener('click', (e) => openEditEventModal(e.target.dataset.id));
    });
    
    document.querySelectorAll('.delete-event').forEach(btn => {
        btn.addEventListener('click', (e) => deleteEvent(e.target.dataset.id));
    });
}

// Open Add Event Modal
function openAddEventModal() {
    addEventModal.classList.add('active');
    document.getElementById('event-title').focus();
}

// Close Add Event Modal
function closeAddEventModal() {
    addEventModal.classList.remove('active');
    // Clear form inputs
    document.getElementById('event-title').value = '';
    document.getElementById('event-date').value = '';
    document.getElementById('event-time').value = '';
    document.getElementById('event-description').value = '';
}

// Open Edit Event Modal
function openEditEventModal(eventId) {
    const event = events.find(e => e.id == eventId);
    
    if (event) {
        document.getElementById('edit-event-id').value = event.id;
        document.getElementById('edit-event-title').value = event.title;
        document.getElementById('edit-event-date').value = event.date;
        document.getElementById('edit-event-time').value = event.time;
        document.getElementById('edit-event-description').value = event.description || '';
        
        editEventModal.classList.add('active');
        document.getElementById('edit-event-title').focus();
    }
}

// Close Edit Event Modal
function closeEditEventModal() {
    editEventModal.classList.remove('active');
}

// Save New Event to server
function saveEvent() {
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const description = document.getElementById('event-description').value.trim();
    
    if (!title || !date || !time) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Create event data object
    const eventData = {
        title,
        date,
        time,
        description
    };
    
    // Send to server
    fetch('/organiser/api/events/add/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify(eventData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Add new event to local array
            events.push(data.event);
            
            // Update UI
            renderEvents();
            closeAddEventModal();
            showToast(data.message, 'success');
            
            // Highlight the new event
            setTimeout(() => {
                const newEventElement = document.querySelector(`[data-id="${data.event.id}"]`);
                if (newEventElement) {
                    newEventElement.classList.add('new');
                    setTimeout(() => newEventElement.classList.remove('new'), 3000);
                }
            }, 100);
        } else {
            showToast(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error saving event:', error);
        showToast('Failed to save event', 'error');
    });
}

// Update Existing Event on server
function updateEvent() {
    const id = document.getElementById('edit-event-id').value;
    const title = document.getElementById('edit-event-title').value.trim();
    const date = document.getElementById('edit-event-date').value;
    const time = document.getElementById('edit-event-time').value;
    const description = document.getElementById('edit-event-description').value.trim();
    
    if (!title || !date || !time) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Create event data object
    const eventData = {
        title,
        date,
        time,
        description
    };
    
    // Send to server
    fetch(`/organiser/api/events/update/${id}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify(eventData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update event in local array
            const eventIndex = events.findIndex(e => e.id == id);
            if (eventIndex !== -1) {
                events[eventIndex] = data.event;
            }
            
            // Update UI
            renderEvents();
            closeEditEventModal();
            showToast(data.message, 'success');
            
            // Highlight the updated event
            setTimeout(() => {
                const updatedEventElement = document.querySelector(`[data-id="${id}"]`);
                if (updatedEventElement) {
                    updatedEventElement.classList.add('new');
                    setTimeout(() => updatedEventElement.classList.remove('new'), 3000);
                }
            }, 100);
        } else {
            showToast(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error updating event:', error);
        showToast('Failed to update event', 'error');
    });
}

// Delete Event from server
function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        // Send to server
        fetch(`/organiser/api/events/delete/${eventId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove event from local array
                events = events.filter(e => e.id != eventId);
                
                // Update UI
                renderEvents();
                showToast(data.message, 'success');
            } else {
                showToast(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting event:', error);
            showToast('Failed to delete event', 'error');
        });
    }
}

// Show Toast Notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Initialize the application
init();