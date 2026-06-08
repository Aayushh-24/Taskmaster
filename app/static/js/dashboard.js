/* ============================================
   TaskMaster — Dashboard JS
   WebSocket + REST API + Analytics
   ============================================ */

const API = {
  async get(path) {
    const r = await fetch(path);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  },
  async put(path, body) {
    const r = await fetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  },
  async delete(path) {
    const r = await fetch(path, { method: 'DELETE' });
    return r.json();
  },
};

// ---- State ----
let tasks = [];
let editingTaskId = null;
let deleteTaskId = null;

// ---- WebSocket ----
const wsIndicator = document.getElementById('wsIndicator');
const wsDot = wsIndicator.querySelector('.ws-dot');
const wsLabel = wsIndicator.querySelector('.ws-label');

const socket = io({ transports: ['websocket', 'polling'] });

socket.on('connect', () => {
  wsDot.classList.add('connected');
  wsLabel.textContent = 'Live';
});

socket.on('disconnect', () => {
  wsDot.classList.remove('connected');
  wsLabel.textContent = 'Offline';
});

socket.on('task_created', ({ task }) => {
  showToast(`✦ New task added: "${task.title}"`);
  tasks.unshift(task);
  renderTasks();
  updateTaskCount();
});

socket.on('task_updated', ({ task }) => {
  showToast(`↻ Task updated: "${task.title}"`);
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx !== -1) tasks[idx] = task;
  renderTasks();
});

socket.on('task_deleted', ({ task_id }) => {
  showToast(`✕ Task removed.`);
  tasks = tasks.filter(t => t.id !== task_id);
  renderTasks();
  updateTaskCount();
});

socket.on('refresh_tasks', () => loadTasks());

// ---- Navigation ----
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`).classList.add('active');

    if (section === 'analytics') loadAnalytics();
  });
});

// ---- Toast ----
function showToast(msg) {
  const toast = document.getElementById('notificationToast');
  toast.textContent = msg;
  toast.style.display = 'flex';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

// ---- Load Tasks ----
async function loadTasks() {
  const status = document.getElementById('statusFilter').value;
  const priority = document.getElementById('priorityFilter').value;
  const search = document.getElementById('searchInput').value;

  let url = '/api/tasks/?';
  if (status) url += `status=${status}&`;
  if (priority) url += `priority=${priority}&`;
  if (search) url += `search=${encodeURIComponent(search)}&`;

  const data = await API.get(url);
  if (data.success) {
    tasks = data.tasks;
    renderTasks();
    updateTaskCount();
  }
}

function updateTaskCount() {
  const el = document.getElementById('taskCount');
  el.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
}

// ---- Render Tasks ----
function renderTasks() {
  const grid = document.getElementById('taskList');

  if (tasks.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <h3>No tasks found</h3>
        <p>Create your first task to get started</p>
      </div>`;
    return;
  }

  grid.innerHTML = tasks.map(task => {
    const date = new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const desc = task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : '';
    return `
      <div class="task-card priority-${task.priority}" data-id="${task.id}">
        <div class="task-card-header">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-actions">
            <button class="action-btn edit-btn" onclick="openEditModal(${task.id})" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="action-btn delete delete-btn" onclick="openDeleteModal(${task.id}, '${escapeHtml(task.title)}')" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </div>
        ${desc}
        <div class="task-meta">
          <span class="badge badge-priority-${task.priority}">${task.priority}</span>
          <span class="badge badge-status-${task.status}">${task.status.replace('_', ' ')}</span>
          <span class="task-date">${date}</span>
        </div>
      </div>`;
  }).join('');
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---- Filters ----
document.getElementById('statusFilter').addEventListener('change', loadTasks);
document.getElementById('priorityFilter').addEventListener('change', loadTasks);

let searchTimer;
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadTasks, 300);
});

// ---- Add/Edit Modal ----
const taskModal = document.getElementById('taskModal');
const modalTitle = document.getElementById('modalTitle');
const taskIdInput = document.getElementById('taskId');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescInput = document.getElementById('taskDescription');
const taskPrioritySelect = document.getElementById('taskPriority');
const taskStatusSelect = document.getElementById('taskStatus');
const modalError = document.getElementById('modalError');

function openAddModal() {
  editingTaskId = null;
  modalTitle.textContent = 'New Task';
  taskIdInput.value = '';
  taskTitleInput.value = '';
  taskDescInput.value = '';
  taskPrioritySelect.value = 'medium';
  taskStatusSelect.value = 'pending';
  modalError.style.display = 'none';
  taskModal.style.display = 'flex';
  taskTitleInput.focus();
}

function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingTaskId = id;
  modalTitle.textContent = 'Edit Task';
  taskIdInput.value = id;
  taskTitleInput.value = task.title;
  taskDescInput.value = task.description || '';
  taskPrioritySelect.value = task.priority;
  taskStatusSelect.value = task.status;
  modalError.style.display = 'none';
  taskModal.style.display = 'flex';
  taskTitleInput.focus();
}

function closeModal() {
  taskModal.style.display = 'none';
}

document.getElementById('openAddModal').addEventListener('click', openAddModal);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);

taskModal.addEventListener('click', (e) => {
  if (e.target === taskModal) closeModal();
});

document.getElementById('saveTask').addEventListener('click', async () => {
  const title = taskTitleInput.value.trim();
  if (!title) {
    modalError.textContent = 'Title is required.';
    modalError.style.display = 'block';
    return;
  }

  const payload = {
    title,
    description: taskDescInput.value.trim(),
    priority: taskPrioritySelect.value,
    status: taskStatusSelect.value,
  };

  const saveBtn = document.getElementById('saveTask');
  saveBtn.disabled = true;

  let data;
  if (editingTaskId) {
    data = await API.put(`/api/tasks/${editingTaskId}`, payload);
  } else {
    data = await API.post('/api/tasks/', payload);
  }

  saveBtn.disabled = false;

  if (data.success) {
    closeModal();
    // Tasks updated via WebSocket; fallback direct update
    if (editingTaskId) {
      const idx = tasks.findIndex(t => t.id === editingTaskId);
      if (idx !== -1) tasks[idx] = data.task;
      renderTasks();
    } else {
      const exists = tasks.find(t => t.id === data.task.id);
      if (!exists) {
        tasks.unshift(data.task);
        renderTasks();
        updateTaskCount();
      }
    }
  } else {
    modalError.textContent = data.message || 'Something went wrong.';
    modalError.style.display = 'block';
  }
});

// ---- Delete Modal ----
const deleteModal = document.getElementById('deleteModal');

function openDeleteModal(id, title) {
  deleteTaskId = id;
  document.getElementById('deleteTaskTitle').textContent = title;
  deleteModal.style.display = 'flex';
}

document.getElementById('cancelDelete').addEventListener('click', () => {
  deleteModal.style.display = 'none';
  deleteTaskId = null;
});

deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    deleteModal.style.display = 'none';
    deleteTaskId = null;
  }
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
  if (!deleteTaskId) return;
  const data = await API.delete(`/api/tasks/${deleteTaskId}`);
  deleteModal.style.display = 'none';
  if (data.success) {
    tasks = tasks.filter(t => t.id !== deleteTaskId);
    renderTasks();
    updateTaskCount();
  }
  deleteTaskId = null;
});

// ---- Analytics ----
async function loadAnalytics() {
  const grid = document.getElementById('analyticsGrid');
  grid.innerHTML = '<div class="loading-state"><div class="loader"></div><p>Loading analytics…</p></div>';

  const data = await API.get('/api/analytics/summary');
  if (!data.success) return;

  const a = data.analytics;
  const pct = a.completion_percentage;

  const statusColors = {
    completed: 'var(--green)',
    in_progress: 'var(--purple)',
    pending: 'var(--accent)',
    cancelled: 'var(--text-3)',
  };

  const statusBreakdownRows = Object.entries(a.status_breakdown || {}).map(([s, info]) => `
    <div class="progress-item">
      <div class="progress-meta">
        <span class="progress-name">${s.replace('_', ' ')}</span>
        <span class="progress-count">${info.count} (${info.percentage}%)</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${info.percentage}%; background:${statusColors[s] || 'var(--accent)'}"></div>
      </div>
    </div>`).join('');

  const priorityBreakdown = a.priority_breakdown || {};

  grid.innerHTML = `
    <div class="stat-card accent">
      <div class="stat-label">Total Tasks</div>
      <div class="stat-value">${a.total_tasks}</div>
      <div class="stat-sub">all time</div>
    </div>
    <div class="stat-card green">
      <div class="stat-label">Completed</div>
      <div class="stat-value">${a.completed_tasks}</div>
      <div class="stat-sub">done</div>
    </div>
    <div class="stat-card blue">
      <div class="stat-label">Pending</div>
      <div class="stat-value">${a.pending_tasks}</div>
      <div class="stat-sub">queued</div>
    </div>
    <div class="stat-card purple">
      <div class="stat-label">In Progress</div>
      <div class="stat-value">${a.in_progress_tasks}</div>
      <div class="stat-sub">active</div>
    </div>
    <div class="stat-card red">
      <div class="stat-label">Completion</div>
      <div class="stat-value">${pct}<span style="font-size:1rem">%</span></div>
      <div class="stat-sub">completion rate</div>
    </div>
    <div class="stat-card accent">
      <div class="stat-label">Productivity</div>
      <div class="stat-value">${a.productivity_score}<span style="font-size:1rem">%</span></div>
      <div class="stat-sub">weighted score</div>
    </div>

    <div class="analytics-wide">
      <h3>Status Breakdown</h3>
      <div class="progress-bar-wrap">${statusBreakdownRows || '<p style="color:var(--text-3);font-size:.85rem">No data yet.</p>'}</div>
    </div>

    <div class="priority-row">
      ${['critical','high','medium','low'].map(p => `
        <div class="priority-chip chip-${p}">
          <div class="priority-chip-label">${p}</div>
          <div class="priority-chip-val">${priorityBreakdown[p] || 0}</div>
        </div>`).join('')}
    </div>`;
}

document.getElementById('refreshAnalytics').addEventListener('click', loadAnalytics);

// ---- Keyboard shortcuts ----
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    taskModal.style.display = 'none';
    deleteModal.style.display = 'none';
  }
  if (e.key === 'n' && !e.target.matches('input, textarea, select') && taskModal.style.display === 'none') {
    openAddModal();
  }
});

// ---- Init ----
loadTasks();
