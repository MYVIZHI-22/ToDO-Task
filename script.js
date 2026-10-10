
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const message = document.getElementById("message");

// Build the correct API URL for ByteXL proxy
function getApiUrl(url) {
  const proxyPrefix =
    window.location.pathname.match(/^\/proxy\/\d+/)?.[0] || "";

  return `${proxyPrefix}${url}`;
}

// Send requests to the server
async function request(url, options = {}) {
  const response = await fetch(getApiUrl(url), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Invalid server response: ${text.slice(0, 100)}`
    );
  }

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

// Display messages
function showMessage(text) {
  message.textContent = text;
}

// Load tasks from the server
async function loadTasks() {
  try {
    const tasks = await request("/api/tasks");
    renderTasks(tasks);
    showMessage("");
  } catch (error) {
    showMessage(error.message);
  }
}

// Display all tasks
function renderTasks(tasks) {
  taskList.replaceChildren();

  let completed = 0;

  tasks.forEach(task => {
    if (task.completed) completed++;

    const item = document.createElement("li");
    item.className = "task";

    if (task.completed) {
      item.classList.add("completed");
    }

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark task completed");

    checkbox.addEventListener("change", async () => {
      try {
        await request(`/api/tasks/${encodeURIComponent(task.id)}`, {
          method: "PATCH",
          body: JSON.stringify({
            completed: checkbox.checked
          })
        });

        await loadTasks();
      } catch (error) {
        showMessage(error.message);
      }
    });

    // Task title
    const title = document.createElement("span");
    title.textContent = task.title;

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-btn";

    deleteButton.addEventListener("click", async () => {
      try {
        await request(`/api/tasks/${encodeURIComponent(task.id)}`, {
          method: "DELETE"
        });

        await loadTasks();
      } catch (error) {
        showMessage(error.message);
      }
    });

    item.append(checkbox, title, deleteButton);
    taskList.appendChild(item);
  });

  totalTasks.textContent = `Total: ${tasks.length}`;
  completedTasks.textContent = `Completed: ${completed}`;
}

// Add a new task
taskForm.addEventListener("submit", async event => {
  event.preventDefault();

  const title = taskInput.value.trim();

  if (!title) {
    showMessage("Please enter a task.");
    taskInput.focus();
    return;
  }

  const addButton = taskForm.querySelector('button[type="submit"]');
  addButton.disabled = true;

  try {
    await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title })
    });

    taskInput.value = "";
    showMessage("");

    await loadTasks();
    taskInput.focus();
  } catch (error) {
    showMessage(error.message);
  } finally {
    addButton.disabled = false;
  }
});

// Load tasks when the page opens
loadTasks();
