const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("server running at http://localhost/3000");
    });
  } catch (e) {
    console.log(`DB ERROR : ${e}`);
    process.exit(1);
  }
};

initializeDbAndServer();

hasStatusPriorityCategoryProperties = (request) => {
  return (
    request.status !== undefined &&
    request.priority !== undefined &&
    request.category !== undefined
  );
};

hasStatusProperties = (request) => {
  return request.status !== undefined;
};

hasPriorityProperties = (request) => {
  return request.priority !== undefined;
};

hasPriorityStatusProperties = (request) => {
  return request.priority !== undefined && request.status !== undefined;
};

hasCategoryStatusProperties = (request) => {
  return request.category !== undefined && request.status !== undefined;
};

hasCategoryProperties = (request) => {
  return request.category !== undefined;
};

hasCategoryPriorityProperties = (request) => {
  return request.category !== undefined && request.priority !== undefined;
};

app.get("/todos/search_q=Buy/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;
  let getTodoQuery = " ";

  switch (true) {
    case hasStatusPriorityCategoryProperties(request.query):
      getTodoQuery = `
             SELECT * FROM todo
             WHERE category = '${category}' AND 
             priority = '${priority}' AND status = '${status}' AND todo LIKE '${search_q}';`;
      break;
    case hasStatusProperties(request.query):
      getTodoQuery = `
             SELECT * FROM todo
             WHERE todo LIKE '${search_q}' AND status = '${status}';`;
      break;
    case hasPriorityProperties(request.query):
      getTodoQuery = `
             SELECT * FROM todo
             WHERE todo LIKE '${search_q}' AND priority = '${priority}';`;
      break;
    case hasPriorityStatusProperties(request.query):
      getTodoQuery = `
             SELECT * FROM todo
             WHERE todo LIKE '${search_q}' AND status = '${status}' AND
             priority = '${priority}';`;
      break;
    case hasCategoryStatusProperties(request.query):
      getTodoQuery = `
             SELECT * FROM todo
             WHERE todo LIKE '${search_q}' AND status = '${status}' 
             AND category = '${category}';`;
      break;
    case hasCategoryProperties(request.query):
      getTodoQuery = `
             SELECT * FROM todo
             WHERE todo LIKE '${search_q}' AND category = '${category}';`;
      break;
    case hasCategoryPriorityProperties(request.query):
      getTodoQuery = `
             SELECT * FROM todo
             WHERE todo LIKE '${search_q}' AND category = '${category}'
             AND priority = '${priority}';`;
      break;
    default:
      getTodoQuery = `
             SELECT * FROM todo
             WHERE todo LIKE '%${search_q}%';`;
  }
  const data = await db.all(getTodoQuery);
  response.send(data);
});

/// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const specificTodoQuery = `
    SELECT * FROM todo WHERE id = ${todoId};`;
  const query = await db.get(specificTodoQuery);
  response.send(query);
});

// API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const getDateQuery = `
    SELECT * FROM todo WHERE due_date = ${date};`;
  const dateQuery = await db.get(getDateQuery);
  response.send(dateQuery);
});

/// API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date)
    VALUES (${id},'${todo}','${priority}','${status}','${category}',${dueDate});`;
  const updateQuery = await db.run(postQuery);
  response.send("Todo Successfully Added");
});

/// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";

  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
  }
  const previousTodoQuery = `
    SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  const updateTodoQuery = `UPDATE todo 
    SET todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category = '${category}',
    due_date = '${dueDate}'
    WHERE id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
