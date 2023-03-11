const express = require('express')
const app = express()


app.use(express.json())

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
    response.json(persons)
})

app.get('/info', (request, response) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };
    const timestamp = new Date().toLocaleString('en-US', options);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset() / 60;
    const count = persons.length;
    response.send(`Phonebook has info for ${count} people. ${timestamp} ${timezone} (GMT${offset >= 0 ? '+' : '-'}${Math.abs(offset)})`);
});

app.get('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    const person = persons.find(person => person.id === id)

    if (person) {
        response.json(person)
    } else {
        response.status(404).end()
    }
})

app.post('/api/persons', (request, response) => {
    const person = request.body
    if (!person.name || !person.number) {
        return response.status(400).json({
            error: 'name or number missing'
        })
    }
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
})


app.delete('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    persons = persons.filter(person => person.id !== id)

    response.status(204).end()
})

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
