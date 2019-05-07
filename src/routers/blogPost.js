const express = require('express')
const auth = require('../middleware/auth')
const BlogPost = require('../models/blogPost')
const multer = require('multer')
const sharp = require('sharp')
const router = new express.Router()

// ================= CREATE =======================
router.post('/blogPosts', auth, async (req, res) => {
    const blogPost = new BlogPost({
        ...req.body
        // author: req.user._id
    })

    try {
        await blogPost.save()
        res.status(201).send(blogPost)
    } catch (e) {
        res.status(400).send(e)
    }
})

// ================= READ =======================
//If author, user should be able to read all of his/her posts
//Otherwise, check is user is subscribed
//If no, refer to Stripe Payment
//If yes, refer to article

// ******************* ALL FREE BLOGPOSTS
router.get('/blogPosts', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.isFree) {
        match.isFree = req.query.isFree === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(":")
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'blogPosts',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.blogPosts) //not displaying
    } catch (e) {
        res.status(500).send()
    }
 
    //if author
    // const isAuthor = await BlogPost.findOne({ 
    //     _id: req.params.id, 
    //     author: req.user._id
    // })

    //if not author
    // if (!isAuthor) {
       
    //     //check if subscriber
    //     try {
    //         req.blogPost.subscribers = req.blogPost.filter((subscriber) =>{
    //             return subscribers.subscriber !== req.user._id
    //         })

    //         res.send(req.blogPost)
    //     } catch (e) {
    //         res.status(500).send()
    //     }
    // }
    
})

// ******************* ALL USER'S BLOGPOSTS

// ******************* A SINGLE BLOGPOST (not verified if working)
router.get('/blogPosts/:id', auth, async (req, res) => {
    const blogPost = await BlogPost.findOne({ _id: req.params.id })

    if (!blogPost) {
        return res.status(404).send()
    }

    //check if free
    if (blogPost.isFree === true) {
        res.send(blogPost)
    }

    //*********************************not tested */
    if (blogPost.author !== req.user.name) {
        return res.status(400).send()
    }

    // check if subscriber or author *************************************
    try {
        blogPost.subscribers = blogPost.filter((subscriber) =>{
        return subscribers.subscriber !== req.user._id
    })
        res.send(blogPost)
    } catch (e) {
        res.status(500).send() // redirect to Stripe
    }
})

// ================= UPDATE =======================
router.patch('/blogPosts/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['title', 'body', 'photo', 'isFree', 'subscribers']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(403).send({ error: 'Invalid updates!'})
    }

    try {
        const blogPost = await BlogPost.findOne({ 
            _id: req.params.id
        })

        if (!blogPost) {
            return res.status(400).send()
        }

        //*********************************not tested */
        if (blogPost.author !== req.user.name) {
            return res.status(400).send()
        }

        updates.forEach((update) => blogPost[update] = req.body[update])
        await blogPost.save()
        res.send(blogPost)
    } catch (e) {
        res.status(400).send(e)
    }
})

// ================= DELETE =======================
router.delete('/blogPosts/:id', auth, async (req, res) => {
    try {
        const blogPost = await BlogPost.findOneAndDelete({
            _id: req.params.id
        })

        if (!blogPost) {
            return res.status(404).send('Blog post doesn\'t exist')
        }

        //*********************************not tested */
        if (blogPost.author !== req.user.name) {
            return res.status(400).send()
        }

        res.send('Blog post has been successfully deleted!')
    } catch (e) {
        res.status(400).send()
    }
})


// ================= CREATE & UPDATE PHOTO =======================
const upload = multer({
    limits: {
        fileSize: 1000000
    }, 
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image.'))
        }
        cb(undefined, true)
    }
})

router.post('/blogPosts/:id/photo', auth, upload.single('photo'), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({
        width: 1300,
        height: 500
    }).png().toBuffer()

    const blogPost = await BlogPost.findOne({ 
        _id: req.params.id
    })

    //*********************************not tested */
    if (blogPost.author !== req.user.name) {
        return res.status(400).send()
    }

    blogPost.photo = buffer // this works when without req!
    await blogPost.save() // this works when without req!
    res.send('Photo has been successfully uploaded!')
}, (error, req, res, next) => {
    res.status(400).send(error)
})

// ================= READ PHOTO =======================
router.get('/blogPosts/:id/photo', async (req, res) => {
    try {
        const blogPost = await BlogPost.findById(req.params.id)

        if (!blogPost || !blogPost.photo) {
            throw new Error()
        }

        //send back the correct data
        res.set('Content-Type', 'image/png') //set content header
        res.send(blogPost.photo)
    } catch (e) {
        res.status(404).send()
    }
})

// ================= DELETE PHOTO =======================
router.delete('/blogPosts/:id/photo', auth, async (req, res) => {
    const blogPost = await BlogPost.findById(req.params.id)

    //*********************************not tested */
    if (blogPost.author !== req.user.name) {
        return res.status(400).send()
    }
    
    blogPost.photo = undefined
    await blogPost.save()
    res.send(req.blogPost)
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

module.exports = router