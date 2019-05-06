const mongoose = require('mongoose')

// connect to db
mongoose.connect(('mongodb://127.0.0.1:27017/blog-app-api'), {
    useNewUrlParser: true, 
    useCreateIndex: true, //allows us to quickly access data
    useFindAndModify: false
})