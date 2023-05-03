/* eslint-disable linebreak-style */
require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const Person = require('./models/person')

app.use(cors())

const password = process.argv[2]
const url = `mongodb+srv://fullstack:${password}@cluster0.kcvya7m.mongodb.net/test?retryWrites=true&w=majority`

mongoose.set('strictQuery', false)
mongoose
  .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((error) => {
    console.log('Error connecting to MongoDB:', error.message)
  })
const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3, // new validation added
    required: true,
  },
  number: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[0-9]{2,3}-[0-9]{7,}$/.test(v)
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
})

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})


app.use(
  morgan(
    ':method :url :status :res[content-length] - :response-time ms :reqBody'
  )
)
app.use(bodyParser.json())

app.use(bodyParser.urlencoded({ extended: true }))
app.use(morgan('tiny'))
app.use(express.static('build'))

app.use(express.json())

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:', request.path)
  console.log('Body:', request.body)
  console.log('---')
  next()
}

app.use(requestLogger)

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons)
  })
})

app.get('/info', (request, response) => {
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short',
  }
  const timestamp = new Date().toLocaleString('en-US', options)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const offset = new Date().getTimezoneOffset() / 60
  const count = Person.length
  response.send(
    `Phonebook has info for ${count} people. ${timestamp} ${timezone} (GMT${
      offset >= 0 ? '+' : '-'
    }${Math.abs(offset)})`
  )
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch((error) => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body
  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'name or number missing',
    })
  }
  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson)
    })
    .catch((error) => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body
  if (!body.name || !body.number) {
    return response.status(400).json({ error: 'Name and number are required' })
  }

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then((updatedPerson) => {
      if (!updatedPerson) {
        return response.status(404).json({ error: 'Person not found' })
      }
      response.json(updatedPerson)
    })
    .catch((error) => next(error))
})

morgan.token('reqBody', (request) => {
  if (request.method === 'POST') {
    return JSON.stringify(request.body)
  }
  return ''
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)
const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }

  next(error)
}

// this has to be the last loaded middleware.
app.use(errorHandler)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
