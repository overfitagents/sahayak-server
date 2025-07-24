var admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const config = require('../config/config');
const logger = require('../config/logger');

const firebaseConfig = {
    type: config.firebase.type,
    project_id: config.firebase.project_id,
    private_key_id: config.firebase.private_key_id,
    private_key: config.firebase.private_key,
    client_email: config.firebase.client_email,
    client_id: config.firebase.client_id,
    auth_uri: config.firebase.auth_uri,
    token_uri: config.firebase.token_uri,
    auth_provider_x509_cert_url: config.firebase.auth_provider_x509_cert_url,
    client_x509_cert_url: config.firebase.client_x509_cert_url,
};

const app = admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
});

const firestore = getFirestore(app);

const sendNotification = async (message, token) => {
    try {
        const response = await admin.messaging().send({ ...message, token });
        console.log('Notification response:', response);
        return null;
    } catch (error) {
        logger.error(`Failed to send notification: ${error}`);
        return token;
    }
};

module.exports = { admin, firestore, sendNotification };
