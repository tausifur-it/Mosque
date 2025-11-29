// ============ GLOBAL CONFIG ============
const ADMIN_USER = "admin";
const ADMIN_PASS = "123456";

// Change city/country for Live Adhan API here:
const PRAYER_API_CITY = "Patna";
const PRAYER_API_COUNTRY = "India";

// Storage keys
const STORAGE_PRAYER = "mosquePrayerTimings";
const STORAGE_EVENTS = "mosqueEvents";

document.addEventListener("DOMContentLoaded", () => {
    initIndexPage();
    initAdminPage();
});

// ============ INDEX PAGE ============
function initIndexPage() {
    // Only run on pages where these elements exist
    const timingsBody = document.getElementById("prayer-timings-body");
    if (timingsBody) {
        loadPrayerTimings();
        loadEventsPublic();
        buildCalendar();
        initLiveAdhanTimings();
        initDonationForm();
        initContactForm();
    }
}

// Default prayer timings if nothing in storage
function getDefaultTimings() {
    return [
        { name: "Fajr", time: "5:00 AM" },
        { name: "Dhuhr", time: "1:00 PM" },
        { name: "Asr", time: "4:10 PM" },
        { name: "Maghrib", time: "5:30 PM" },
        { name: "Isha", time: "7:10 PM" },
        { name: "Jumu’ah", time: "1:15 PM" }
    ];
}

function loadPrayerTimings() {
    const timingsBody = document.getElementById("prayer-timings-body");
    if (!timingsBody) return;

    let timings = getDefaultTimings();
    const stored = localStorage.getItem(STORAGE_PRAYER);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length) timings = parsed;
        } catch (e) {}
    }

    timingsBody.innerHTML = "";
    timings.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.name}</td><td>${row.time}</td>`;
        timingsBody.appendChild(tr);
    });
}

// Load events from storage or default
function getDefaultEvents() {
    // Use ISO date format
    return [
        { title: "Jumu’ah Khutbah", date: "2025-12-05", time: "13:15" },
        { title: "Weekly Tafseer", date: "2025-12-06", time: "18:30" }
    ];
}

function loadEvents() {
    const stored = localStorage.getItem(STORAGE_EVENTS);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
    }
    return getDefaultEvents();
}

function loadEventsPublic() {
    const listEl = document.getElementById("events-list");
    if (!listEl) return;

    const events = loadEvents();
    listEl.innerHTML = "";

    if (!events.length) {
        listEl.innerHTML = "<li>No upcoming events.</li>";
        return;
    }

    events
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach(ev => {
            const li = document.createElement("li");
            li.textContent = `${formatDate(ev.date)} – ${ev.title} (${ev.time})`;
            listEl.appendChild(li);
        });
}

// Calendar
function buildCalendar() {
    const calendarEl = document.getElementById("calendar");
    if (!calendarEl) return;

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const events = loadEvents();

    const eventsByDate = {};
    events.forEach(ev => {
        eventsByDate[ev.date] = true;
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay(); // 0-6 (Sun-Sat)

    const monthName = now.toLocaleString("default", { month: "long" });

    calendarEl.innerHTML = "";

    const header = document.createElement("div");
    header.className = "calendar-header";
    header.innerHTML = `<span>${monthName} ${year}</span>`;
    calendarEl.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "calendar-grid";

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayNames.forEach(d => {
        const div = document.createElement("div");
        div.className = "calendar-day-name";
        div.textContent = d;
        grid.appendChild(div);
    });

    for (let i = 0; i < startDay; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day";
        grid.appendChild(empty);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateStr = `${year}-${pad2(month + 1)}-${pad2(d)}`;
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day";
        if (eventsByDate[dateStr]) {
            dayDiv.classList.add("has-event");
        }
        dayDiv.textContent = d;
        grid.appendChild(dayDiv);
    }

    calendarEl.appendChild(grid);
}

function pad2(n) {
    return n.toString().padStart(2, "0");
}

function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// Live Adhan / Prayer Timings via API
function initLiveAdhanTimings() {
    const box = document.getElementById("live-adhan-box");
    if (!box) return;

    const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
        PRAYER_API_CITY
    )}&country=${encodeURIComponent(PRAYER_API_COUNTRY)}&method=2`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data || data.code !== 200) throw new Error("API error");

            const timings = data.data.timings;
            const dateInfo = data.data.date.readable;

            box.innerHTML = `
                <p><strong>Date:</strong> ${dateInfo}</p>
                <p><strong>Fajr:</strong> ${timings.Fajr}</p>
                <p><strong>Dhuhr:</strong> ${timings.Dhuhr}</p>
                <p><strong>Asr:</strong> ${timings.Asr}</p>
                <p><strong>Maghrib:</strong> ${timings.Maghrib}</p>
                <p><strong>Isha:</strong> ${timings.Isha}</p>
            `;
        })
        .catch(err => {
            box.innerHTML = `<p>Could not load live timings. Check internet / API.</p>`;
            console.error(err);
        });
}

// Donation form - just show success message (no real payment)
function initDonationForm() {
    const form = document.getElementById("donation-form");
    const msg = document.getElementById("donation-message");
    if (!form) return;

    form.addEventListener("submit", e => {
        e.preventDefault();
        msg.textContent = "JazakAllahu Khairan! We received your donation intent.";
        form.reset();
    });
}

// Contact form - simple reset & message
function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    form.addEventListener("submit", e => {
        e.preventDefault();
        alert("Thank you for contacting us. We will get back to you insha’Allah.");
        form.reset();
    });
}

// ============ ADMIN PAGE ============
function initAdminPage() {
    const loginForm = document.getElementById("admin-login-form");
    const dashboard = document.getElementById("admin-dashboard");
    const loginBox = document.getElementById("admin-login-box");

    if (!loginForm || !dashboard) return; // not on admin page

    const savedLoggedIn = sessionStorage.getItem("masjidAdminLoggedIn");
    if (savedLoggedIn === "true") {
        showDashboard(loginBox, dashboard);
    }

    loginForm.addEventListener("submit", e => {
        e.preventDefault();
        const user = document.getElementById("admin-username").value.trim();
        const pass = document.getElementById("admin-password").value.trim();
        const errorEl = document.getElementById("admin-login-error");

        if (user === ADMIN_USER && pass === ADMIN_PASS) {
            sessionStorage.setItem("masjidAdminLoggedIn", "true");
            showDashboard(loginBox, dashboard);
            errorEl.textContent = "";
        } else {
            errorEl.textContent = "Invalid credentials.";
        }
    });

    initPrayerAdmin();
    initEventsAdmin();
}

function showDashboard(loginBox, dashboard) {
    loginBox.classList.add("hidden");
    dashboard.classList.remove("hidden");
}

// Admin – prayer management
function initPrayerAdmin() {
    const form = document.getElementById("prayer-form");
    if (!form) return;

    const defaultTimings = getDefaultTimings();
    const stored = localStorage.getItem(STORAGE_PRAYER);
    let timings = defaultTimings;

    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length) timings = parsed;
        } catch (e) {}
    }

    // populate fields
    timings.forEach(t => {
        const input = form.querySelector(`input[name="${t.name}"]`);
        if (input) input.value = t.time;
    });

    form.addEventListener("submit", e => {
        e.preventDefault();
        const newTimings = [];

        defaultTimings.forEach(t => {
            const input = form.querySelector(`input[name="${t.name}"]`);
            const time = input && input.value.trim() ? input.value.trim() : t.time;
            newTimings.push({ name: t.name, time });
        });

        localStorage.setItem(STORAGE_PRAYER, JSON.stringify(newTimings));
        const msg = document.getElementById("prayer-save-message");
        if (msg) msg.textContent = "Prayer timings saved successfully.";
        setTimeout(() => { if (msg) msg.textContent = ""; }, 3000);
    });
}

// Admin – events
function initEventsAdmin() {
    const form = document.getElementById("event-form");
    const listEl = document.getElementById("admin-events-list");
    if (!form || !listEl) return;

    let events = loadEvents();
    renderAdminEvents(listEl, events);

    form.addEventListener("submit", e => {
        e.preventDefault();
        const title = document.getElementById("event-title").value.trim();
        const date = document.getElementById("event-date").value;
        const time = document.getElementById("event-time").value;

        if (!title || !date || !time) return;

        events.push({ title, date, time });
        localStorage.setItem(STORAGE_EVENTS, JSON.stringify(events));
        renderAdminEvents(listEl, events);
        form.reset();
    });
}

function renderAdminEvents(listEl, events) {
    listEl.innerHTML = "";
    if (!events.length) {
        listEl.innerHTML = "<li>No events created yet.</li>";
        return;
    }

    events
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((ev, index) => {
            const li = document.createElement("li");
            li.textContent = `${formatDate(ev.date)} – ${ev.title} (${ev.time})`;

            const delBtn = document.createElement("button");
            delBtn.textContent = "Delete";
            delBtn.addEventListener("click", () => {
                events.splice(index, 1);
                localStorage.setItem(STORAGE_EVENTS, JSON.stringify(events));
                renderAdminEvents(listEl, events);
            });

            li.appendChild(delBtn);
            listEl.appendChild(li);
        });
}
