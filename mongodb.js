const mongodb = require('mongodb')
//GIVES US ACCESS TO CONNECT TO DB AND PERFORM CRUD
const { MongoClient, ObjectID } = require('mongodb') 

//CONNECT TO LOCAL HOST SERVER THAT'S UP AND RUNNING
const connectURL = process.env.MONGODB_URI
const databaseName = 'blog-app'

//CONNECT TO SERVER
MongoClient.connect(connectURL, 
    { useNewUrlParser: true }, 
    (error, client) => {
        if (error) {
            return console.log('Unable to connect to db.')
        }

        //CREATE DB
        const db = client.db(databaseName)

        // db.collection('users').insertOne({
        //     name: 'Joyce',
        //     age: 33
        // }, (error, result) => {
        //     if (error) {
        //         return console.log('Unable to insert user.')
        //     }

        //     result.ops
        // })
})