require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const bodyParser = require('body-parser');
const { request } = require('express');
const mongoose = require('mongoose');
const Person = require('./models/person')

const password = process.argv[2]
const url =
  `mongodb+srv://fullstack:${password}@cluster0.kcvya7m.mongodb.net/test?retryWrites=true&w=majority`

mongoose.set('strictQuery',false)
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})

const Person = mongoose.model('Person', personSchema)

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :reqBody'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('tiny'))
app.use(express.static('build'))

app.use(express.json())

app.use(requestLogger)

let persons = [
    {
        "id": 1,
        "name": "Arto Hellas",
        "number": "040-123456"
    },
    {
        "id": 2,
        "name": "Ada Lovelace",
        "number": "39-44-5323523"
    },
    {
        "id": 3,
        "name": "Dan Abramov",
        "number": "12-43-234345"
    },
    {
        "id": 4,
        "name": "Mary Poppendieck",
        "number": "39-23-6423122"
    }
]

app.get('/', (request, response) => {
    response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

app.get('/info', (request, response) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };
    const timestamp = new Date().toLocaleString('en-US', options);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset() / 60;
    const count = persons.length;
    response.send(`Phonebook has info for ${count} people. ${timestamp} ${timezone} (GMT${offset >= 0 ? '+' : '-'}${Math.abs(offset)})`);
});

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id).then(person => {
        if (person) {
            response.json(person)
          } else {
            response.status(404).end()
          }
        })
        .catch(error => next(error))
    })

app.post('/api/persons', (request, response) => {
    const body = request.body
    if (!body.name || !body.number) {
        return response.status(400).json({
            error: 'name or number missing'
        })
    }
    const person = new Person({
        name: body.name,
        number: body.number,
      })
    
      person.save().then(savedPerson => {
        response.json(savedPerson)
      })
    })

    const existingPerson = persons.find(p => p.name === person.name)
    if (existingPerson) {
        return response.status(400).json({
            error: 'name must be unique'
        })
    }
    const maxId = persons.length > 0 ? Math.max(...persons.map(n => n.id)) : 0
    person.id = maxId + 1
    persons = persons.concat(person)
    response.json(person)


app.delete('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    persons = persons.filter(person => person.id !== id)

    response.status(204).end()
})

personSchema.set('toJSON', {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString()
      delete returnedObject._id
      delete returnedObject.__v
    }
  }) 

morgan.token('reqBody', (request, response) => {
    if (request.method === 'POST') {
        return JSON.stringify(request.body);
    }
    return '';
});

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
