const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        //STEP 1: access value from header using req.header
        //STEP 2: get jwt out of the entire header value using replace
        const token = req.header('Authorization').replace('Bearer ', '')
        //STEP 3: make sure that token is valid: created by server & hasn't expired
        const decoded = jwt.verify(token, "secret")
        //STEP 4: find the user in the db and 
        //STEP 5: check if tokens if still part of the tokens array
        const user = await User.findOne({ _id: decoded._id, 'token': token })
    
        //STEP 6: Check if user exists
        if (!user) {
            throw new Error()
        }
        //STEP 9: Give route handler access to the token to be deleted correctly
        req.token = token
        //STEP 7: Give route handler access to the user that we fetched in the db
        req.user = user
        //STEP 8: Make route handler run if user is authenticated
        next()
    } catch (e) {
        res.status(401).send({ error: 'Please authenticate. '})
    }
}

module.exports = auth