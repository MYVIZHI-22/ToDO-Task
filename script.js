
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const message = document.getElementById("message");

let tasks = [];

try {
  tasks = JSON.parse(localStorage.getItem("todoTasks") || "[]");
  if (!Array.isArray(tasks)) tasks = [];
} catch {
  tasks = [];
}

function saveTasks() {
  localStorage.setItem("todoTasks", JSON.stringify(tasks));
}

function renderTasks() {
  taskList.replaceChildren();

  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task";

    if (task.completed) li.classList.add("completed");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;

    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const span = document.createElement("span");
    span.textContent = task.title;

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.className = "delete-btn";

    del.addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    li.append(checkbox, span, del);
    taskList.appendChild(li);
  });

  totalTasks.textContent = `Total: ${tasks.length}`;
  completedTasks.textContent =
    `Completed: ${tasks.filter(t => t.completed).length}`;
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskInput.value.trim();

  if (!title) {
    message.textContent = "Please enter a task.";
    return;
  }

  tasks.push({
    id: Date.now().toString(),
    title,
    completed: false
  });

  try {
    saveTasks();
    renderTasks();
    taskInput.value = "";
    message.textContent = "";
  } catch {
    message.textContent = "Unable to save tasks in this browser.";
  }
});

renderTasks();
