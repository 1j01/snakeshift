// eslint-env node
import express from 'express'
import { json } from 'body-parser'

const app = express()
const PORT = process.env.PORT || 3000

let commandsQueue = []

// Middleware to parse JSON bodies
app.use(json())

// Endpoint to receive commands from clients
app.post('/command', (req, res) => {
  const { command } = req.body
  commandsQueue.push(command)
  res.status(200).send('Command received')
})

// Endpoint for clients to long-poll for commands
app.get('/get-command', (req, res) => {
  if (commandsQueue.length > 0) {
    const command = commandsQueue.shift()
    res.status(200).json({ command })
  } else {
    // No command available, long-polling - keep the request open
    setTimeout(() => {
      res.status(200).json({ command: null })
    }, 5000) // Example: respond after 5 seconds
  }
})

// Endpoint to receive console output from clients
app.post('/log', (req, res) => {
  const { message } = req.body
  console.log(message)
  res.status(200).send('OK')
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
