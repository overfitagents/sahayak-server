var express = require('express');
var router = express.Router();


const {createSession, newMessage, FCMToken} = require('../../controllers/agentController');
// const { protect } = require('../../controllers/authController');

module.exports = (app) => {
    // Define routes

    router.get('/session', createSession);
    router.post('/message', newMessage);
    router.post('/fcm-token', FCMToken);

    // register all above routes
    app.use('/api/v1', router);
};
