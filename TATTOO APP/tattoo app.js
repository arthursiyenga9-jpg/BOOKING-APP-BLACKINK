// --- INITIALIZATION ---
const canvas = document.getElementById('tattoo-canvas');
const ctx = canvas?.getContext('2d');
const appointmentForm = document.getElementById('appointment-form');
const appointmentsList = document.getElementById('appointments');
const uploadInput = document.getElementById('customer-design-upload');
const previewGallery = document.getElementById('customer-preview-gallery');
let isDrawing = false;

// --- 1. IMAGE UPLOAD LOGIC ---
if (uploadInput) {
    uploadInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.className = 'preview-img';
                img.style.width = '150px';
                img.style.borderRadius = '10px';
                img.style.margin = '10px';

                // Show the image in the gallery
                previewGallery.innerHTML = ''; // Keep only the latest upload
                previewGallery.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

// --- 2. DRAWING TOOL LOGIC ---
if (canvas) {
    canvas.addEventListener('mousedown', () => isDrawing = true);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = document.getElementById('color-picker').value;
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });
    document.getElementById('clear').onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('save').onclick = () => {
        const link = document.createElement('a');
        link.download = 'blackink-sketch.png';
        link.href = canvas.toDataURL();
        link.click();
    };
}

// --- 3. BOOKING LOGIC ---
appointmentForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const apptData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        description: document.getElementById('tattoo-description').value,
        id: Date.now()
    };

    const localAppts = JSON.parse(localStorage.getItem('appointments')) || [];
    const isTaken = localAppts.some(a => a.date === apptData.date && a.time === apptData.time);

    if (isTaken) {
        alert("🚨 This slot is already booked. Please choose a different time.");
        return;
    }

    // Using your Service and Template IDs
    emailjs.send("service_bmhafjm", "template_oztapjd", apptData)
        .then(() => {
            localAppts.push(apptData);
            localStorage.setItem('appointments', JSON.stringify(localAppts));
            alert("✅ Booking Success! The artist has been notified.");
            appointmentForm.reset();
            previewGallery.innerHTML = '';
            loadAppointments();
        }, (error) => {
            alert("❌ Failed to send booking: " + JSON.stringify(error));
        });
});

// --- 4. MANAGE BOOKINGS SEARCH ---
function deleteBooking(id) {
    if (confirm("Cancel this appointment?")) {
        let appts = JSON.parse(localStorage.getItem('appointments')) || [];
        appts = appts.filter(a => a.id !== id);
        localStorage.setItem('appointments', JSON.stringify(appts));
        loadAppointments();
    }
}

function loadAppointments() {
    const userEmail = document.getElementById('manage-email').value.toLowerCase();
    const appts = JSON.parse(localStorage.getItem('appointments')) || [];

    if (!userEmail) {
        appointmentsList.innerHTML = '<li style="list-style:none;">Enter email above to view your bookings.</li>';
        return;
    }

    const filtered = appts.filter(a => a.email.toLowerCase() === userEmail);

    if (filtered.length === 0) {
        appointmentsList.innerHTML = '<li style="list-style:none;">No bookings found for this email.</li>';
    } else {
        appointmentsList.innerHTML = filtered.map(a => `
            <li class="appointment-card" style="border-left: 5px solid #2ecc71; padding: 15px; background: #151517; border-radius: 10px; list-style:none; margin-top: 10px; display: flex; justify-content: space-between;">
                <div>
                    <strong>${a.date} @ ${a.time}</strong><br>
                    <small>${a.description.substring(0, 30)}...</small>
                </div>
                <button onclick="deleteBooking(${a.id})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Cancel</button>
            </li>
        `).join('');
    }
}