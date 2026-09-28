const page = document.body.dataset.page;
const $ = (selector) => document.querySelector(selector);
let availableInternships = [];

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'same-origin'
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  return result;
}

function showMessage(text, type = '') {
  const target = $('#message');
  if (!target) return;
  target.textContent = text;
  target.className = `notice ${type}`.trim();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function formatDate(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

async function loadProfile() {
  const { profile } = await api('/api/profile');
  for (const [key, value] of Object.entries(profile)) {
    const input = $(`[name="${key}"]`);
    if (input) input.value = value || '';
  }
}

function renderInternships(internships) {
  const container = $('#internship-list');
  if (!container) return;

  const resultsCount = $('#results-count');
  if (resultsCount) resultsCount.textContent = `${internships.length} ${internships.length === 1 ? 'opportunity' : 'opportunities'}`;

  container.innerHTML = internships.length ? internships.map((item) => `
    <article class="card internship-card">
      <p class="card-kicker">${escapeHtml(item.location || 'Location flexible')}</p>
      <h2>${escapeHtml(item.title)}</h2>
      <p class="company-name">${escapeHtml(item.company)}</p>
      <p>${escapeHtml(item.description)}</p>
      <div class="skill-list">${(item.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean).map((skill) => `<span class="skill-pill">${escapeHtml(skill)}</span>`).join('') || '<span class="skill-pill">Skills not specified</span>'}</div>
      <div class="card-bottom"><p class="meta"><strong>${escapeHtml(item.stipend || 'Stipend not specified')}</strong><br>${escapeHtml(item.duration || 'Duration not specified')} · Apply by ${formatDate(item.deadline)}</p>
      <a class="button" href="apply.html?id=${encodeURIComponent(item.id)}">View opportunity <span aria-hidden="true">→</span></a></div>
    </article>`).join('') : '<p class="empty">No internships are available right now.</p>';
}

async function loadInternships() {
  const { internships } = await api('/api/internships');
  availableInternships = internships;
  renderInternships(availableInternships);
  return availableInternships;
}

function renderApplications(applications, admin = false) {
  const target = $('#application-table');
  if (!target) return;
  if (!applications.length) {
    target.innerHTML = '<p class="empty">No applications to show.</p>';
    return;
  }
  const rows = applications.map((item) => `<tr>
    ${admin ? `<td>${escapeHtml(item.candidate_name)}<br><span class="muted">${escapeHtml(item.candidate_email)}</span></td>` : ''}
    <td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.company)}</td>
    <td>${formatDate(item.applied_at)}</td>
    <td>${admin ? `<select data-status-id="${item.id}">${['Applied', 'Shortlisted', 'Rejected', 'Selected'].map((status) => `<option ${status === item.status ? 'selected' : ''}>${status}</option>`).join('')}</select>` : `<span class="status">${escapeHtml(item.status)}</span>`}</td>
  </tr>`).join('');
  target.innerHTML = `<div class="table-wrap"><table><thead><tr>${admin ? '<th>Candidate</th>' : ''}<th>Internship</th><th>Company</th><th>Applied</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

async function loadApplications(admin = false) {
  const { applications } = await api('/api/applications');
  renderApplications(applications, admin);
  return applications;
}

async function loadCandidates() {
  const { candidates } = await api('/api/candidates');
  const target = $('#candidate-table');
  if (target) {
    target.innerHTML = candidates.length ? `<div class="table-wrap"><table><thead><tr><th>Name and email</th><th>Phone</th><th>Education</th><th>Skills</th><th>Resume</th></tr></thead><tbody>${candidates.map((candidate) => `<tr>
      <td>${escapeHtml(candidate.name)}<br><span class="muted">${escapeHtml(candidate.email)}</span></td>
      <td>${escapeHtml(candidate.phone)}</td><td>${escapeHtml(candidate.education)}</td><td>${escapeHtml(candidate.skills)}</td>
      <td>${candidate.resume ? `<a href="${escapeHtml(candidate.resume)}" target="_blank" rel="noopener">Open</a>` : 'Not added'}</td>
    </tr>`).join('')}</tbody></table></div>` : '<p class="empty">No candidates have registered yet.</p>';
  }
  return candidates;
}

function renderManageInternships(internships) {
  const target = $('#managed-internships');
  target.innerHTML = internships.length ? `<div class="table-wrap"><table><thead><tr><th>Internship</th><th>Location</th><th>Deadline</th><th>Actions</th></tr></thead><tbody>${internships.map((item) => `<tr>
    <td><strong>${escapeHtml(item.title)}</strong><br>${escapeHtml(item.company)}</td><td>${escapeHtml(item.location)}</td><td>${formatDate(item.deadline)}</td>
    <td><div class="actions"><button type="button" class="secondary" data-edit-id="${item.id}">Edit</button><button type="button" class="danger" data-delete-id="${item.id}">Delete</button></div></td>
  </tr>`).join('')}</tbody></table></div>` : '<p class="empty">No internships have been added.</p>';
  target._internshipItems = internships;
}

async function loadManagedInternships() {
  const { internships } = await api('/api/internships');
  renderManageInternships(internships);
}

async function guardPage(expectedRole) {
  try {
    const { user } = await api('/api/me');
    if (user.role !== expectedRole) {
      window.location.href = user.role === 'admin' ? '/admin/admin-dashboard.html' : '/candidate/index.html';
      return false;
    }
    return true;
  } catch {
    window.location.href = expectedRole === 'admin' ? '/admin/admin-login.html' : '/candidate/login.html';
    return false;
  }
}

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-action]');
  if (!form) return;
  event.preventDefault();
  showMessage('');
  const values = formData(form);
  try {
    if (form.dataset.action === 'login' || form.dataset.action === 'register') {
      const endpoint = form.dataset.action === 'register' ? '/api/register' : '/api/login';
      const { user } = await api(endpoint, { method: 'POST', body: JSON.stringify(values) });
      const expectedRole = form.dataset.role;
      if (user.role !== expectedRole) throw new Error('This account does not have access to this login page.');
      window.location.href = user.role === 'admin' ? '/admin/admin-dashboard.html' : '/candidate/index.html';
      return;
    }
    if (form.dataset.action === 'profile') {
      const result = await api('/api/profile', { method: 'PUT', body: JSON.stringify(values) });
      showMessage(result.message, 'success');
    }
    if (form.dataset.action === 'apply') {
      const result = await api('/api/applications', { method: 'POST', body: JSON.stringify({ internship_id: form.dataset.internshipId }) });
      showMessage(result.message, 'success');
      form.querySelector('button').disabled = true;
    }
    if (form.dataset.action === 'internship') {
      const id = form.dataset.id;
      const result = await api(id ? `/api/internships/${id}` : '/api/internships', {
        method: id ? 'PUT' : 'POST', body: JSON.stringify(values)
      });
      form.reset();
      form.dataset.id = '';
      $('#internship-submit').textContent = 'Add internship';
      showMessage(result.message, 'success');
      await loadManagedInternships();
    }
  } catch (error) { showMessage(error.message, 'error'); }
});

document.addEventListener('click', async (event) => {
  if (event.target.closest('[data-logout]')) {
    event.preventDefault();
    await api('/api/logout', { method: 'POST' });
    window.location.href = '/candidate/index.html';
  }
  const editButton = event.target.closest('[data-edit-id]');
  if (editButton) {
    const item = $('#managed-internships')._internshipItems.find((entry) => entry.id === Number(editButton.dataset.editId));
    const form = $('[data-action="internship"]');
    form.dataset.id = item.id;
    for (const [key, value] of Object.entries(item)) {
      const field = form.querySelector(`[name="${key}"]`);
      if (field) field.value = key === 'deadline' ? String(value).slice(0, 10) : value || '';
    }
    $('#internship-submit').textContent = 'Save changes';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const deleteButton = event.target.closest('[data-delete-id]');
  if (deleteButton && window.confirm('Delete this internship and its applications?')) {
    try {
      const result = await api(`/api/internships/${deleteButton.dataset.deleteId}`, { method: 'DELETE' });
      showMessage(result.message, 'success');
      await loadManagedInternships();
    } catch (error) { showMessage(error.message, 'error'); }
  }
});

document.addEventListener('change', async (event) => {
  const status = event.target.closest('[data-status-id]');
  if (!status) return;
  try {
    const result = await api(`/api/applications/${status.dataset.statusId}/status`, {
      method: 'PATCH', body: JSON.stringify({ status: status.value })
    });
    showMessage(result.message, 'success');
  } catch (error) { showMessage(error.message, 'error'); }
});

async function startPage() {
  try {
    if (page === 'home') await loadInternships();
    if (page === 'profile' && await guardPage('candidate')) await loadProfile();
    if (page === 'internships') {
      const links = $('.nav-links');
      try {
        const { user } = await api('/api/me');
        if (user.role === 'candidate') links.dataset.loggedIn = 'true';
      } catch { /* Listings remain public. */ }
      await loadInternships();
    }
    if (page === 'apply') {
      if (!await guardPage('candidate')) return;
      const internshipId = new URLSearchParams(window.location.search).get('id');
      const { internships } = await api('/api/internships');
      const item = internships.find((entry) => String(entry.id) === internshipId);
      if (!item) { $('#apply-details').innerHTML = '<p class="empty">Internship not found.</p>'; return; }
      $('#apply-details').innerHTML = `<h2>${escapeHtml(item.title)}</h2><p class="meta">${escapeHtml(item.company)} · ${escapeHtml(item.location)}</p><p>${escapeHtml(item.description)}</p><p><strong>Skills:</strong> ${escapeHtml(item.skills)}</p><p>Deadline: ${formatDate(item.deadline)}</p>`;
      $('[data-action="apply"]').dataset.internshipId = item.id;
    }
    if (page === 'applications' && await guardPage('candidate')) await loadApplications();
    if (page === 'admin-dashboard' && await guardPage('admin')) {
      const [internships, candidates, applications] = await Promise.all([loadInternships(), loadCandidates(), loadApplications(true)]);
      $('#internship-count').textContent = internships.length;
      $('#candidate-count').textContent = candidates.length;
      $('#application-count').textContent = applications.length;
      renderApplications(applications.slice(0, 5), true);
    }
    if (page === 'candidates' && await guardPage('admin')) await loadCandidates();
    if (page === 'manage-internships' && await guardPage('admin')) await loadManagedInternships();
    if (page === 'admin-applications' && await guardPage('admin')) await loadApplications(true);
  } catch (error) { showMessage(error.message, 'error'); }
}

startPage();