/* ============================================================
   MEDI SYNC – Main Script
   ============================================================ */

/* ── UTILS ── */
function $(id) { return document.getElementById(id); }
function showError(id, msg) {
  const el = $(id);
  if (el) { el.innerHTML = msg ? `⚠ ${msg}` : ''; }
}
function clearErrors(...ids) { ids.forEach(id => showError(id, '')); }

function showToast(id = 'toast', duration = 3500) {
  const t = $(id);
  if (!t) return;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function setLoading(btn, state) {
  if (!btn) return;
  btn.classList.toggle('loading', state);
  btn.disabled = state;
}

function fakeDelay(ms = 1200) { return new Promise(r => setTimeout(r, ms)); }

/* ── COUNTER ANIMATION (index page) ── */
function animateCounters() {
  document.querySelectorAll('.counter').forEach(el => {
    const target = +el.dataset.target;
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;
    const update = () => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current) + (target >= 100 ? '+' : '');
      if (current < target) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
}

/* ── LOGIN ── */
function validateLogin(e) {
  if (e) e.preventDefault();
  clearErrors('emailErr', 'pwErr');
  let valid = true;
  const email = $('loginEmail')?.value.trim();
  const pw    = $('loginPassword')?.value;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('emailErr', 'Please enter a valid email address.');
    valid = false;
  }
  if (!pw || pw.length < 6) {
    showError('pwErr', 'Password must be at least 6 characters.');
    valid = false;
  }
  if (!valid) return;
  const btn = $('loginBtn');
  setLoading(btn, true);
  fakeDelay().then(() => {
    setLoading(btn, false);
    showToast();
    setTimeout(() => window.location.href = 'index.html', 2000);
  });
}

/* ── SIGNUP ── */
function validateSignup(e) {
  if (e) e.preventDefault();
  clearErrors('nameErr','phoneErr','emailErr','pwErr','confirmErr','termsErr');
  let valid = true;
  const name    = $('signupName')?.value.trim();
  const phone   = $('signupPhone')?.value.trim();
  const email   = $('signupEmail')?.value.trim();
  const pw      = $('signupPassword')?.value;
  const confirm = $('confirmPassword')?.value;
  const terms   = $('terms')?.checked;

  if (!name || name.length < 2) { showError('nameErr', 'Please enter your full name.'); valid = false; }
  if (!phone || !/^\+?[\d\s\-]{8,15}$/.test(phone)) { showError('phoneErr', 'Enter a valid phone number.'); valid = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('emailErr', 'Enter a valid email address.'); valid = false; }
  if (!pw || pw.length < 8) { showError('pwErr', 'Password must be at least 8 characters.'); valid = false; }
  if (pw && confirm !== pw) { showError('confirmErr', 'Passwords do not match.'); valid = false; }
  if (!terms) { showError('termsErr', 'You must accept the terms to continue.'); valid = false; }
  if (!valid) return;

  const btn = $('signupBtn');
  setLoading(btn, true);
  fakeDelay().then(() => {
    setLoading(btn, false);
    showToast();
    setTimeout(() => window.location.href = 'login.html', 2500);
  });
}

/* Password strength meter */
function initPasswordStrength() {
  const pw = $('signupPassword');
  const bar = $('pwStrength');
  if (!pw || !bar) return;
  pw.addEventListener('input', () => {
    const v = pw.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#e53935', '#fb8c00', '#43a047', '#1b5e20'];
    bar.innerHTML = v ? `<div style="height:4px;border-radius:2px;width:${score*25}%;background:${colors[score]};transition:all 0.3s;"></div><span style="font-size:0.75rem;color:${colors[score]};margin-top:3px;display:block;">${labels[score]}</span>` : '';
  });
}

/* ── ROOM BOOKING ── */
let selectedRoom = null;
function selectRoom(el) {
  document.querySelectorAll('.room-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedRoom = { value: el.dataset.value, price: +el.dataset.price, label: el.querySelector('h4').textContent };
  updateCostSummary();
}

function updateCostSummary() {
  const days = +($('roomDays')?.value || 0);
  const cs = $('costSummary');
  if (!cs || !selectedRoom) return;
  if (days > 0) {
    cs.style.display = 'block';
    $('summaryLabel').textContent = `${selectedRoom.label} × ${days} day${days > 1 ? 's' : ''}`;
    $('summaryTotal').textContent = `₹${(selectedRoom.price * days).toLocaleString('en-IN')}`;
  } else {
    cs.style.display = 'none';
  }
}

function validateRoomBooking(e) {
  if (e) e.preventDefault();
  clearErrors('roomTypeErr','nameErr','phoneErr','checkInErr','daysErr');
  let valid = true;
  const name    = $('roomPatientName')?.value.trim();
  const phone   = $('roomPhone')?.value.trim();
  const checkIn = $('checkIn')?.value;
  const days    = +($('roomDays')?.value);

  if (!selectedRoom) { showError('roomTypeErr', 'Please select a room type.'); valid = false; }
  if (!name || name.length < 2) { showError('nameErr', 'Patient name is required.'); valid = false; }
  if (!phone || !/^\+?[\d\s\-]{8,15}$/.test(phone)) { showError('phoneErr', 'Enter a valid contact number.'); valid = false; }
  if (!checkIn) { showError('checkInErr', 'Check-in date is required.'); valid = false; }
  if (!days || days < 1) { showError('daysErr', 'Enter at least 1 day.'); valid = false; }
  if (!valid) return;

  setLoading($('roomBtn'), true);
  fakeDelay().then(() => {
    setLoading($('roomBtn'), false);
    showToast();
  });
}

/* ── APPOINTMENT (Multi-step) ── */
const doctors = {
  cardiology:  ['Dr. Priya Sharma – Cardiologist', 'Dr. Rajan Patel – Interventional Cardiology'],
  ortho:       ['Dr. Suresh Kumar – Orthopedic Surgeon', 'Dr. Anitha Rao – Sports Medicine'],
  neuro:       ['Dr. Meena Krishnan – Neurologist', 'Dr. Vijay Das – Neurosurgeon'],
  pediatrics:  ['Dr. Kavitha Nair – Pediatrician', 'Dr. Arjun Mehta – Child Specialist'],
  general:     ['Dr. Sanjay Iyer – General Physician', 'Dr. Lakshmi Prasad – Family Medicine'],
};

function updateDoctors() {
  const dept = $('apptDept')?.value;
  const sel  = $('apptDoctor');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select Doctor</option>';
  (doctors[dept] || []).forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    sel.appendChild(o);
  });
}

function nextStep(current) {
  let valid = true;
  if (current === 1) {
    clearErrors('apptNameErr','apptPhoneErr','apptAgeErr');
    const name  = $('apptName')?.value.trim();
    const phone = $('apptPhone')?.value.trim();
    const age   = +($('apptAge')?.value);
    if (!name) { showError('apptNameErr', 'Patient name is required.'); valid = false; }
    if (!phone || !/^\+?[\d\s\-]{8,15}$/.test(phone)) { showError('apptPhoneErr', 'Valid phone number required.'); valid = false; }
    if (!age || age < 1) { showError('apptAgeErr', 'Enter a valid age.'); valid = false; }
  } else if (current === 2) {
    clearErrors('apptDeptErr','apptDoctorErr');
    if (!$('apptDept')?.value) { showError('apptDeptErr', 'Please select a department.'); valid = false; }
    if (!$('apptDoctor')?.value) { showError('apptDoctorErr', 'Please select a doctor.'); valid = false; }
  }
  if (!valid) return;
  $('step' + current).style.display = 'none';
  $('step' + (current + 1)).style.display = 'block';
  updateStepBar(current + 1);
}

function prevStep(current) {
  $('step' + current).style.display = 'none';
  $('step' + (current - 1)).style.display = 'block';
  updateStepBar(current - 1);
}

function updateStepBar(active) {
  for (let i = 1; i <= 3; i++) {
    const el = $('step' + i + 'Label');
    if (el) el.classList.toggle('active', i === active);
  }
}

function validateAppointment(e) {
  if (e) e.preventDefault();
  clearErrors('apptDateErr','apptTimeErr');
  let valid = true;
  if (!$('apptDate')?.value) { showError('apptDateErr', 'Please select a date.'); valid = false; }
  if (!$('apptTime')?.value) { showError('apptTimeErr', 'Please select a time slot.'); valid = false; }
  if (!valid) return;
  setLoading($('apptBtn'), true);
  fakeDelay().then(() => { setLoading($('apptBtn'), false); showToast(); });
}

/* ── AMBULANCE ── */
function validateAmbulance(e) {
  if (e) e.preventDefault();
  clearErrors('ambNameErr','ambPhoneErr','ambPickupErr','ambTypeErr');
  let valid = true;
  const name   = $('ambName')?.value.trim();
  const phone  = $('ambPhone')?.value.trim();
  const pickup = $('ambPickup')?.value.trim();
  const type   = $('ambType')?.value;
  if (!name) { showError('ambNameErr', 'Patient name is required.'); valid = false; }
  if (!phone || !/^\+?[\d\s\-]{8,15}$/.test(phone)) { showError('ambPhoneErr', 'Valid phone number required.'); valid = false; }
  if (!pickup) { showError('ambPickupErr', 'Pickup address is required.'); valid = false; }
  if (!type) { showError('ambTypeErr', 'Please select ambulance type.'); valid = false; }
  if (!valid) return;
  setLoading($('ambBtn'), true);
  fakeDelay(800).then(() => { setLoading($('ambBtn'), false); showToast(); });
}

/* ── CONTACT ── */
function validateContact(e) {
  if (e) e.preventDefault();
  clearErrors('contactNameErr','contactEmailErr','contactMsgErr');
  let valid = true;
  const name  = $('contactName')?.value.trim();
  const email = $('contactEmail')?.value.trim();
  const msg   = $('contactMsg')?.value.trim();
  if (!name) { showError('contactNameErr', 'Your name is required.'); valid = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('contactEmailErr', 'Valid email required.'); valid = false; }
  if (!msg || msg.length < 10) { showError('contactMsgErr', 'Please enter a message (10+ characters).'); valid = false; }
  if (!valid) return;
  setLoading($('contactBtn'), true);
  fakeDelay().then(() => { setLoading($('contactBtn'), false); showToast(); });
}

/* ── PASSWORD TOGGLE ── */
function togglePassword(inputId, btn) {
  const inp = $(inputId);
  if (!inp) return;
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁️'; }
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  // Set min date for date inputs
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(d => d.min = today);

  // Attach form handlers
  const loginForm = $('loginForm');
  const signupForm = $('signupForm');
  const roomForm = $('roomForm');
  const apptForm = $('apptForm');
  const ambForm = $('ambulanceForm');
  const contactForm = $('contactForm');

  if (loginForm) loginForm.addEventListener('submit', validateLogin);
  if (signupForm) { signupForm.addEventListener('submit', validateSignup); initPasswordStrength(); }
  if (roomForm) {
    roomForm.addEventListener('submit', validateRoomBooking);
    $('roomDays')?.addEventListener('input', updateCostSummary);
  }
  if (apptForm) apptForm.addEventListener('submit', validateAppointment);
  if (ambForm) ambForm.addEventListener('submit', validateAmbulance);
  if (contactForm) contactForm.addEventListener('submit', validateContact);

  // Counter animation after slight delay
  setTimeout(animateCounters, 600);
});
