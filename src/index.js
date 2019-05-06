const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')

const app = express()
const port = process.env.PORT || 3000

/*Automatically parse incoming JSON 
to an object so we can access it 
in our request handlers*/
app.use(express.json())
app.use(userRouter) //router is in separate file

//load models in
const User = require('./models/user')

const multer = require('multer')


app.listen(port, () => {
    console.log('Server is up on port ' + port)
})