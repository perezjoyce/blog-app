const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp') // for images

// ================= CREATE =======================
router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

// ================= LOGIN =======================
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        let token = user.token
       
        if(!token) {
            token = await user.generateAuthToken()
            await user.save()
        }
        
        if (user.status === 'deactivated') {
            user.status = 'active'
            await user.save()
        }
        res.send({ user, token })
    } catch (e) {
        res.send(e)
    }
})

// ================= LOGOUT (NOT WORKING) =======================
router.post('/users/logout', auth, async (req, res) => {
    //refactor so that there is only one token
    try {
        // req.user.tokens = req.user.tokens.filter((token) => {
        //     return token.token !== req.token
        // })
        req.user.token = null
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// router.post('/users/logoutAll', auth, async (req, res) => {
//     try {
//         req.user.tokens = [] //delete contents
//         await req.user.save() //save user
//         res.send('You have been logged out!')
//     } catch (e) {
//         res.status(500).send(e)
//     }
// })


// ================= READ =======================
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user) 
})

router.get('/users/:id', auth, async (req, res) => {
    try {

        const user = await User.findOne({
            _id: req.params.id
        })

        if (!user) {
            return res.status(404).send()
        }

        res.send(user) 
    } catch (e) {
        res.status(404).send()
    }
})

// ================= UPDATE =======================
router.patch('/users/:id', auth, async (req, res) => {
    
    const updates = Object.keys(req.body)
   
    const allowedUpdates = ['_id', 'name', 'email', 'plan', 'status', 'isAdmin', 'password', 'token']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!'})
    } 

    try {
        const user = await User.findOne({
            _id: req.params.id
        })

        if (!user) {
            return res.status(404).send()
        }


        updates.forEach((update) => user[update] = req.body[update])
        await user.save()


        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// ================= DELETE =======================
router.put('/users/me', auth, async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)

        if(!user) {
            return res.status(404).send()
        }
        
        user.status = 'deactivated'
        await user.save()
        res.send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})

// ================= CREATE & UPDATE AVATAR =======================
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

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    //buffer of modified image file
    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer()
    
    //save modified buffer in User model to avatar
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    //handle errors
    res.status(400).send({ error: error.message })
})

// ================= READ AVATAR =======================
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        //send back the correct data
        res.set('Content-Type', 'image/png') //set content header
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

// ================= DELETE AVATAR =======================
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send(req.user)
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})


module.exports = router