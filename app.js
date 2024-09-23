const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const isValid = require('date-fns/isValid')
const format = require('date-fns/format')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDbandServer = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB ERROR: ${error.message}`)
    process.exit(1)
  }
}
initializeDbandServer()

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasDueDateProperty = requestQuery => {
  return requestQuery.dueDate !== undefined
}

const hasPriorityAndStatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndStatusProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriorityProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const convtDueDate = todoItem => ({
  id: todoItem.id,
  todo: todoItem.todo,
  priority: todoItem.priority,
  status: todoItem.status,
  category: todoItem.category,
  dueDate: todoItem.due_date,
})

const isStatusValid = todoStatus => {
  if (
    todoStatus === 'TO DO' ||
    todoStatus === 'IN PROGRESS' ||
    todoStatus === 'DONE'
  ) {
    return true
  } else {
    return false
  }
}
const isPriorityValid = todoPriority => {
  if (
    todoPriority === 'HIGH' ||
    todoPriority === 'MEDIUM' ||
    todoPriority === 'LOW'
  ) {
    return true
  } else {
    return false
  }
}

const isCategoryValid = todoCategory => {
  if (
    todoCategory === 'WORK' ||
    todoCategory === 'HOME' ||
    todoCategory === 'LEARNING'
  ) {
    return true
  } else {
    return false
  }
}

const isValidDueDate = item => {
  return isValid(new Date(item))
}

//*** API -1 ***

app.get('/todos/', async (request, response) => {
  const {priority, status, category, search_q = ''} = request.query
  let query = ''

  switch (true) {
    case hasStatusProperty(request.query):
      query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}';`

      if (isStatusValid(status)) {
        data = await db.all(query)
        response.send(data.map(eachData => convtDueDate(eachData)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasPriorityProperty(request.query):
      query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}';`

      if (isPriorityValid(priority)) {
        data = await db.all(query)
        response.send(data.map(eachData => convtDueDate(eachData)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasCategoryProperty(request.query):
      query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}';`

      if (isCategoryValid(category)) {
        data = await db.all(query)
        response.send(data.map(eachData => convtDueDate(eachData)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriorityAndStatusProperty(request.query):
      query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}' AND status = '${status}';`

      if (isPriorityValid(priority) && isStatusValid(status)) {
        data = await db.all(query)
        response.send(data.map(eachData => convtDueDate(eachData)))
      } else if (isPriorityValid(priority)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasCategoryAndPriorityProperty(request.query):
      query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}' AND priority = '${priority}';`

      if (isCategoryValid(category) && isPriorityValid(priority)) {
        data = await db.all(query)
        response.send(data.map(eachData => convtDueDate(eachData)))
      } else if (isCategoryValid(category)) {
        response.status(400)
        response.send('Invalid Todo Priority')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasCategoryAndStatusProperty(request.query):
      query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}' AND status = '${status}';`

      if (isCategoryValid(category) && isStatusValid(status)) {
        data = await db.all(query)
        response.send(data.map(eachData => convtDueDate(eachData)))
      } else if (isCategoryValid(category)) {
        response.status(400)
        response.send('Invalid Todo Status')
      } else {
        response.status(400)

        response.send('Invalid Todo Category')
      }
      break
    default:
      query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`

      data = await db.all(query)
      response.send(data.map(eachData => convtDueDate(eachData)))
  }
})

//*** API -2 ***

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoQuery = `SELECT * FROM todo WHERE id =${todoId};`

  const data = await db.get(getTodoQuery)
  response.send(convtDueDate(data))
})

//*** API -3 ***

app.get('/agenda/', async (request, response) => {
  const {date} = request.query

  if (date === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    if (isValidDueDate(date)) {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd')
      const getAgendaQuery = `SELECT * FROM todo WHERE due_date = '${formattedDate}';`

      const data = await db.all(getAgendaQuery)
      response.send(data.map(eachData => convtDueDate(eachData)))
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
})

//*** API -4 ***

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  switch (false) {
    case isStatusValid(status):
      response.status(400)
      response.send('Invalid Todo Status')
      break
    case isCategoryValid(category):
      response.status(400)
      response.send('Invalid Todo Category')
      break
    case isPriorityValid(priority):
      response.status(400)
      response.send('Invalid Todo Priority')
      break
    case isValidDueDate(dueDate):
      response.status(400)
      response.send('Invalid Due Date')
      break
    default:
      const formattedDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
      const createTodoQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date) VALUES(${id},'${todo}','${priority}','${status}','${category}','${formattedDueDate}');`
      const data = await db.run(createTodoQuery)
      response.send('Todo Successfully Added')
  }
})
//*** API -5 ***

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {todo, priority, status, category, dueDate} = request.body

  switch (true) {
    case hasStatusProperty(request.body):
      const updateStatusQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId};`

      if (isStatusValid(status)) {
        await db.run(updateStatusQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasCategoryProperty(request.body):
      const updateCategoryQuery = `UPDATE todo SET category = '${category}' WHERE id = ${todoId};`

      if (isCategoryValid(category)) {
        await db.run(updateCategoryQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriorityProperty(request.body):
      const updateProiorityQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`

      if (isPriorityValid(priority)) {
        await db.run(updateProiorityQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasDueDateProperty(request.body):
      const updateDueDateQuery = `UPDATE todo SET due_date = '${dueDate}' WHERE id = ${todoId};`

      if (isValidDueDate(dueDate)) {
        await db.run(updateDueDateQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
    default:
      const defaultUpdateQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId};`
      await db.run(defaultUpdateQuery)
      response.send('Todo Updated')
      break
  }
})

//*** API -6 ***

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId}`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
