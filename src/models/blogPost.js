const mongoose = require('mongoose')

const blogPostSchema = new mongoose.Schema({
    author: {
        type: String,
        default: "Joyce Perez"
    },
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    synopsis: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    }, 
    isFree: {
        type: Boolean,
        default: false
    },
    subscribers: [{
        subscriber:{
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    }], 
    photo: {
        type: Buffer,
        default: 0

    }
}, {
    timestamps: true
})

blogPostSchema.virtual('user', {
    ref: 'User',
    localField: '_id', //user
    foreignField: 'subscribers' //name of field on other thing
})

//Display blogPost
blogPostSchema.methods.toJSON = function () {
    const blogPost = this
    //return raw object with just blogPost data
    const blogPostObject = blogPost.toObject()
    return blogPostObject
}


//set relationship between user and task
// userSchema.virtual('users', {
//     ref: 'User',
//     localField: '_id', //user
//     foreignField: 'author' //name of field on other thing
// })

const BlogPost = mongoose.model('BlogPost', blogPostSchema)

module.exports = BlogPost