const express = require('express')
const path = require('path')
const { get } = require('request')
const bodyParser = require('body-parser');

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const srcDir = path.join(__dirname, './src')
app.use(express.static(srcDir))
app.use(express.static(path.join(__dirname, './img')))
app.use(express.static(path.join(__dirname, './dist')))
app.get('/', (req, res) => res.send('Hello World'))
app.get('/face_recognition', (req, res) => res.sendFile(path.join(srcDir, 'faceRecognition.html')))
app.listen(3001, () => console.log('Listening on port 3000!'))