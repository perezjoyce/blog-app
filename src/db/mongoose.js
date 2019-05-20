const mongoose = require('mongoose')

// connect to db
mongoose.connect((process.env.MONGODB_URI), {
    useNewUrlParser: true, 
    useCreateIndex: true, //allows us to quickly access data
    useFindAndModify: false
})