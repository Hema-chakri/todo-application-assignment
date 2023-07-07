const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    status: dbObject.status,
    priority: dbObject.priority,
    category: dbObject.category,
    dueDate: format(dbObject.due_date, yyyy - MM - dd),
  };
};

const middlewareFunction = (request, response, next) => {
  const { status, priority, category, todo, dueDate } = request.query;
  next();
};

//Get todo based on Query
app.get("/todos/", middlewareFunction, async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const {
    search_q = "",
    priority = "",
    status = "",
    category = "",
  } = request.query;
  const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };
  const hasCategoryAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.category !== undefined && requestQuery.status !== undefined
    );
  };

  const hasCategoryAndPriorityProperties = (requestQuery) => {
    return (
      requestQuery.category !== undefined && requestQuery.priority !== undefined
    );
  };

  const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };
  const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
  };
  const hasSearchProperty = (requestQuery) => {
    return requestQuery.search_q !== undefined;
  };

  const hasCategoryProperty = (requestQuery) => {
    return requestQuery.category !== undefined;
  };

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            priority = '${priority}'
            AND status = '${status}';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            category = '${category}'
            AND status = '${status}';`;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            category = '${category}'
            AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            status = '${status}';`;
      break;
    case hasSearchProperty(request.query):
      getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            todo LIKE '%${search_q}%';`;
      break;

    case hasCategoryProperty(request.query):
      getTodoQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            category = '${category}';`;
      break;
  }
  data = await db.all(getTodoQuery);
  response.send(data);
});

//Get Specific todo API
app.get("/todos/:todoId/", middlewareFunction, async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoQuery = `
    SELECT
        *
    FROM 
        todo
    WHERE
        id = ${todoId};`;
  const getTodo = await db.get(getSpecificTodoQuery);
  response.send(getTodo);
});

//Get todo with Specific date API
app.get("/agenda/", middlewareFunction, async (request, response) => {
  const { date } = request.query;
  const getTodoWithDueDate = `
    SELECT
        *
    FROM
        todo
    WHERE
        due_date = '${date}';`;
  const givenDate = await db.all(getTodoWithDueDate);
  response.send(givenDate);
});

//Add todo item to todo table API
app.post("/todos/", middlewareFunction, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const addTodoQuery = `
    INSERT INTO
        todo ( id, todo, priority, status, category, due_date)
    VALUES 
        (
            ${id},
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${dueDate}'
        );`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//update todo based on request API
app.put("/todos/:todoId/", middlewareFunction, async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let updatedInfo = "";
  let updateTodoQuery = "";
  const hasUpdateStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
  };
  const hasUpdatePriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };
  const hasUpdateCategoryProperty = (requestQuery) => {
    return requestQuery.category !== undefined;
  };
  const hasUpdateTodoProperty = (requestQuery) => {
    return requestQuery.todo !== undefined;
  };
  const hasUpdateDueDateProperty = (requestQuery) => {
    return requestQuery.dueDate !== undefined;
  };
  switch (true) {
    case hasUpdateStatusProperty(request.body):
      updateTodoQuery = `
            UPDATE
                todo
            SET
                status = '${status}'
            WHERE
                id = ${todoId};`;
      updatedInfo = "Status";
      break;
    case hasUpdatePriorityProperty(request.body):
      updateTodoQuery = `
            UPDATE
                todo
            SET
                priority = '${priority}'
            WHERE
                id = ${todoId};`;
      updatedInfo = "Priority";
      break;
    case hasUpdateCategoryProperty(request.body):
      updateTodoQuery = `
            UPDATE
                todo
            SET
                category = '${category}'
            WHERE
                id = ${todoId};`;
      updatedInfo = "Category";
      break;
    case hasUpdateDueDateProperty(request.body):
      updateTodoQuery = `
            UPDATE
                todo
            SET
                due_date = '${dueDate}'
            WHERE
                id = ${todoId};`;
      updatedInfo = "Due Date";
      break;
    case hasUpdateTodoProperty(request.body):
      updateTodoQuery = `
            UPDATE
                todo
            SET
                todo = '${todo}'
            WHERE
                id = ${todoId};`;
      updatedInfo = "Todo";
      break;
  }
  await db.run(updateTodoQuery);
  response.send(`${updatedInfo} Updated`);
});

//Delete Todo API
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
        todo
    WHERE
        id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
