//load in dependencies
const mongoose = require('mongoose')
const validator = require('validator')
const uniqueValidator = require('mongoose-unique-validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
// const Task = require('../models/task')

/*Create the schema first and pass that 
in to be able to use more advanced features*/

//define properties for schema
const userSchema = new mongoose.Schema({
    //define the MODEL we're working with
    name: {
        type: String, //constructor function from JS
        required: true, 
        trim: true
    }, 
    email: {
        type: String,
        unique: true, 
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    }, 
    password: {
        type: String,
        required: true, 
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().match('password')) {
                throw new Error('Password shouldn\'t contain "password"')
            }
        }
    }, 
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }], 
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

// set relationship between user and task
// userSchema.virtual('tasks', {
//     ref: 'Task',
//     localField: '_id', //user
//     foreignField: 'owner' //name of field on other thing
// })

//for unique validator
userSchema.plugin(uniqueValidator)

//defines findByCredentials method on User model
userSchema.statics.findByCredentials = async (email, password) => {
    //find user by email
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login') //don't be too specific!
    } 

    return user
}

//generate auth token
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, "secret")
    //save token to database
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

//Display profile
userSchema.methods.toJSON = function () {
    const user = this
    //return raw object with just user data
    const userObject = user.toObject()
    //manipulate userObject to change what we share to login users
    delete userObject.password
    delete userObject.tokens

    //remove avatar data from profile response to lighten JSON response
    delete userObject.avatar

    return userObject
}

//hash plain text password 
userSchema.pre('save', async function (next) {
    //access to individual user we want to save
    const user = this

    //hash password
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

//pass userSchema as second arg to model
const User = mongoose.model('User', userSchema)

module.exports = User