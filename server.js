
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "tasks.json");

app.use(express.json());
app.use(express.static(__dirname));

// Read tasks from JSON file
function readTasks() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "[]");
    }

    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("Error reading tasks:", error);
    throw error;
  }
}

// Save tasks to JSON file
function saveTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

// Display the frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Get all tasks
app.get("/api/tasks", (req, res) => {
  try {
    res.json(readTasks());
  } catch (error) {
    res.status(500).json({ error: "Unable to load tasks." });
  }
});

// Add a new task
app.post("/api/tasks", (req, res) => {
  const title =
    typeof req.body.title === "string"
      ? req.body.title.trim()
      : "";

  if (!title) {
    return res.status(400).json({
      error: "Task title is required."
    });
  }

  try {
    const tasks = readTasks();

    const task = {
      id: crypto.randomUUID(),
      title: title,
      completed: false
    };

    tasks.push(task);
    saveTasks(tasks);

    res.status(201).json(task);
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({ error: "Unable to save task." });
  }
});

// Update task completion status
app.patch("/api/tasks/:id", (req, res) => {
  if (typeof req.body.completed !== "boolean") {
    return res.status(400).json({
      error: "Invalid completion status."
    });
  }

  try {
    const tasks = readTasks();
    const task = tasks.find(
      item => item.id === req.params.id
    );

    if (!task) {
      return res.status(404).json({
        error: "Task not found."
      });
    }

    task.completed = req.body.completed;
    saveTasks(tasks);

    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Unable to update task." });
  }
});

// Delete a task
app.delete("/api/tasks/:id", (req, res) => {
  try {
    const tasks = readTasks();
    const updatedTasks = tasks.filter(
      item => item.id !== req.params.id
    );

    if (updatedTasks.length === tasks.length) {
      return res.status(404).json({
        error: "Task not found."
      });
    }

    saveTasks(updatedTasks);

    res.json({
      message: "Task deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Unable to delete task." });
  }
});

// Handle unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found." });
});

// Handle invalid JSON requests
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON request." });
  }

  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`To-Do Task Manager running on port ${PORT}`);
});
