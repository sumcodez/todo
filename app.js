// ─── State ──────────────────────────────────────────────────────────────────

/** @type {{ id: string, text: string, priority: string, completed: boolean, createdAt: number }[]} */
let tasks = [];
let currentFilter = 'all';

// ─── DOM References ──────────────────────────────────────────────────────────

const taskInput         = document.getElementById('taskInput');
const prioritySelectEl  = document.getElementById('prioritySelect');
const addBtn            = document.getElementById('addBtn');
const taskList          = document.getElementById('taskList');
const emptyState        = document.getElementById('emptyState');
const taskCount         = document.getElementById('taskCount');
const filterBtns        = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

// ─── Custom Priority Select ───────────────────────────────────────────────────

/** Currently selected priority value */
let selectedPriority = 'medium';

/**
 * Set the custom select to a given value and update the UI
 * @param {string} value
 */
function setSelectValue(value) {
  selectedPriority = value;

  // Update trigger dot + label
  const dot   = prioritySelectEl.querySelector('.cs-trigger .cs-dot');
  const label = prioritySelectEl.querySelector('.cs-label');
  dot.dataset.priority = value;
  label.textContent = value.charAt(0).toUpperCase() + value.slice(1);

  // Update selected option highlight
  prioritySelectEl.querySelectorAll('.cs-option').forEach(opt => {
    const isSelected = opt.dataset.value === value;
    opt.classList.toggle('cs-selected', isSelected);
    opt.setAttribute('aria-selected', isSelected);
  });
}

/** Open / close the dropdown */
function toggleSelect(force) {
  const isOpen = prioritySelectEl.classList.contains('open');
  const shouldOpen = force !== undefined ? force : !isOpen;
  prioritySelectEl.classList.toggle('open', shouldOpen);
}

// Trigger click
prioritySelectEl.querySelector('.cs-trigger').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleSelect();
});

// Option click
prioritySelectEl.querySelectorAll('.cs-option').forEach(opt => {
  opt.addEventListener('click', (e) => {
    e.stopPropagation();
    setSelectValue(opt.dataset.value);
    toggleSelect(false);
    taskInput.focus();
  });
});

// Keyboard navigation
prioritySelectEl.addEventListener('keydown', (e) => {
  const opts = ['high', 'medium', 'low'];
  const idx  = opts.indexOf(selectedPriority);
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(); }
  if (e.key === 'Escape')                  { toggleSelect(false); }
  if (e.key === 'ArrowDown') { e.preventDefault(); setSelectValue(opts[(idx + 1) % 3]); }
  if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectValue(opts[(idx + 2) % 3]); }
});

// Close on outside click
document.addEventListener('click', () => toggleSelect(false));

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Generate a unique ID */
const uid = () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/** Save tasks to localStorage */
const saveTasks = () => localStorage.setItem('taski_tasks', JSON.stringify(tasks));

/** Load tasks from localStorage */
const loadTasks = () => {
  const stored = localStorage.getItem('taski_tasks');
  if (stored) {
    try { tasks = JSON.parse(stored); }
    catch { tasks = []; }
  }
};

/** Sanitize user input to prevent XSS */
const sanitize = (str) => {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};

// ─── Core Logic ───────────────────────────────────────────────────────────────

/**
 * Add a new task
 */
function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    // Shake animation on empty submit
    taskInput.classList.add('shake');
    taskInput.addEventListener('animationend', () => taskInput.classList.remove('shake'), { once: true });
    taskInput.focus();
    return;
  }

  const task = {
    id: uid(),
    text,
    priority: selectedPriority,
    completed: false,
    createdAt: Date.now(),
  };

  tasks.unshift(task); // newest first
  saveTasks();
  taskInput.value = '';
  taskInput.focus();
  renderTasks();
}

/**
 * Toggle task completion
 * @param {string} id
 */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

/**
 * Delete a task with animation
 * @param {string} id
 */
function deleteTask(id) {
  const li = document.querySelector(`[data-id="${id}"]`);
  if (li) {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();
    }, { once: true });
  }
}

/**
 * Enter edit mode for a task
 * @param {string} id
 */
function startEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const li = document.querySelector(`[data-id="${id}"]`);
  const textEl = li.querySelector('.task-text');
  const actionsEl = li.querySelector('.task-actions');

  // Replace text with input
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'task-edit-input';
  editInput.value = task.text;
  editInput.maxLength = 120;

  textEl.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  // Replace edit button with save button
  const editBtn = actionsEl.querySelector('.edit-btn');
  editBtn.textContent = 'Save';
  editBtn.classList.remove('edit-btn');
  editBtn.classList.add('save-btn');

  // Save on Enter or blur
  const saveEdit = () => {
    const newText = editInput.value.trim();
    if (newText) {
      task.text = newText;
      saveTasks();
    }
    renderTasks();
  };

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') renderTasks(); // cancel
  });

  actionsEl.querySelector('.save-btn').addEventListener('click', saveEdit);
  editInput.addEventListener('blur', () => {
    // Small delay to allow save button click to register first
    setTimeout(saveEdit, 150);
  });
}

/**
 * Clear all completed tasks
 */
function clearCompleted() {
  const completedEls = document.querySelectorAll('.task-item.completed');
  if (completedEls.length === 0) return;

  completedEls.forEach(li => {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== li.dataset.id);
      saveTasks();
      renderTasks();
    }, { once: true });
  });
}

// ─── Rendering ────────────────────────────────────────────────────────────────

/**
 * Get the filtered + sorted task list
 */
function getFilteredTasks() {
  let filtered = [...tasks];

  if (currentFilter === 'completed') filtered = filtered.filter(t => t.completed);
  if (currentFilter === 'pending')   filtered = filtered.filter(t => !t.completed);

  // Sort: pending first, then completed
  filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  return filtered;
}

/**
 * Create a task list item element
 * @param {{ id: string, text: string, priority: string, completed: boolean }} task
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item${task.completed ? ' completed' : ''}`;
  li.dataset.id = task.id;
  li.dataset.priority = task.priority;

  li.innerHTML = `
    <div class="task-checkbox${task.completed ? ' checked' : ''}" 
         role="checkbox" 
         aria-checked="${task.completed}" 
         tabindex="0"
         aria-label="Mark task ${task.completed ? 'incomplete' : 'complete'}">
    </div>
    <div class="task-body">
      <span class="task-text">${sanitize(task.text)}</span>
      <span class="priority-badge ${task.priority}">${task.priority}</span>
    </div>
    <div class="task-actions">
      <button class="action-btn edit-btn" title="Edit task">Edit</button>
      <button class="action-btn delete-btn" title="Delete task">✕</button>
    </div>
  `;

  // Toggle complete via checkbox click
  const checkbox = li.querySelector('.task-checkbox');
  checkbox.addEventListener('click', () => toggleTask(task.id));
  checkbox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTask(task.id); }
  });

  // Edit button
  li.querySelector('.edit-btn').addEventListener('click', () => startEdit(task.id));

  // Delete button
  li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

  return li;
}

/**
 * Render the task list based on current state
 */
function renderTasks() {
  const filtered = getFilteredTasks();

  taskList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    filtered.forEach(task => {
      taskList.appendChild(createTaskElement(task));
    });
  }

  updateTaskCount();
}

/**
 * Update the header task count
 */
function updateTaskCount() {
  const total     = tasks.length;
  const pending   = tasks.filter(t => !t.completed).length;
  const completed = tasks.filter(t => t.completed).length;

  if (total === 0) {
    taskCount.textContent = 'No tasks yet';
  } else {
    taskCount.textContent = `${pending} pending · ${completed} done`;
  }
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

// Add button click
addBtn.addEventListener('click', addTask);

// Enter key in input
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// Clear completed
clearCompletedBtn.addEventListener('click', clearCompleted);

// ─── Shake Animation (CSS injected) ──────────────────────────────────────────

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }
  .shake { animation: shake 0.35s ease; }
`;
document.head.appendChild(shakeStyle);

// ─── Init ─────────────────────────────────────────────────────────────────────

loadTasks();
renderTasks();