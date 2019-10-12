const axios = require('axios');
require('dotenv').config();

const TOKEN = process.env.TOKEN;

const sendMessage = async(sender, messageData) => {

    let url = `https://graph.facebook.com/v2.6/me/messages?access_token=${TOKEN}`;
    let headers = {
        'Content-Type': 'application/json'
    }

    let fields = {
        recipient: {
            id: sender
        },
        "messaging_type": "RESPONSE",
        message: messageData
    }

    let response = await axios.post(url, fields, {headers});

    if (response['status'] == 200 && response['statusText'] === 'OK') {
        return 1;
    } else {
        return 0;
    }
};

module.exports = {
    sendMessage
}