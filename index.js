const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const gd = require('./helper-functions/google-dialogflow');
const ad = require('./helper-functions/airtable-database');
const fm = require('./helper-functions/facebook-messenger');

const fs = require('fs');
const uuid = require('uuid');
let sessionId = uuid.v4();
fs.writeFileSync('key.text', sessionId);

const webApp = express();

webApp.use(bodyParser.urlencoded({
    extended: true
}))

webApp.use(bodyParser.json()); 

const PORT = process.env.PORT;
const TOKEN = process.env.TOKEN;

// This get method is to check the app is working
webApp.get('/', (req, res) => {
    res.status(200).send(`Hello World.!`);
});

// This method is to verify the Facebook webhook
webApp.get('/webhook', (req, res) => {
    
    let mode = req['query']['hub.mode'];
    let token = req['query']['hub.verify_token'];
    let challenge = req['query']['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === TOKEN) {
            console.log('Webhook verified by Facebook.')
            res.status(200).send(challenge);
        } else {
            res.status(403).send('Forbidden');
        }
    }
});

// Format the output of Dialogflow
// and make it ready for Facebook Messenger
const formatMessage = (fulfillmentMessages) => {

    if (fulfillmentMessages['message'] === 'text') {

        let formatMessageData = {
            'text': fulfillmentMessages['text']['text'][0]
        }
        return formatMessageData;
    } else if (fulfillmentMessages['message'] === 'quickReplies') {

        let quickReplies = fulfillmentMessages['quickReplies']['quickReplies'];
        let text = fulfillmentMessages['quickReplies']['title'];
        let quick_replies = [];
        quickReplies.forEach(qr => {
            let tempDict = {};

            tempDict['content_type'] = 'text';
            tempDict['title'] = qr;
            tempDict['payload'] = '<POSTBACK_PAYLOAD>'
            
            quick_replies.push(tempDict);
        });

        let formatMessageData = {
            'text': text,
            'quick_replies': quick_replies
        }

        return formatMessageData;
    }
};

// Get senderID, text, and URL from the incoming message
// from Facebook Messenger
const getSenderIDText = (body) => {

    let messageData = {};

    let entry = body['entry'][0];
    let messaging = entry['messaging'][0];
    let senderID = messaging['sender']['id'];

    messageData['senderID'] = senderID;

    try {
        messageData['GET_STARTED'] = messaging['postback']['title'];
    } catch (error) {
        messageData['GET_STARTED'] = 'NO-DATA';
    }

    try {
        messageData['messageText'] = messaging['message']['text'];
    } catch (error) {
        messageData['messageText'] = 'NO-DATA';
    }

    try {
        messageData['URL'] = messaging['message']['attachments'][0]['payload']['url'];
    } catch (error) {
        messageData['URL'] = 'NO-DATA';
    }

    return messageData;
};

// This method is called when someone
// sends message to the chatbot
webApp.post('/webhook', async (req, res) => {
    
    let body = req['body'];

    let messageData = getSenderIDText(body);

    if (body['object'] === 'page' && messageData['GET_STARTED'] !== 'NO-DATA') {

        let intentData = await gd.checkIntent('hello');
        let formatMessageData = formatMessage(intentData['fulfillmentMessages']);
        fm.sendMessage(messageData['senderID'], formatMessageData);
        res.status(200).send('OK');    
    } else if ((body['object'] === 'page' && messageData['URL'] !== 'NO-DATA')) {

        let intentData = await gd.checkIntent('image');
        let formatMessageData = formatMessage(intentData['fulfillmentMessages']);
        let bug = intentData['outputContexts'][0]['parameters']['fields']['any.original']['stringValue'];
        
        let fields = {
            'Notes': bug,
            'Attachments': [{
                'url': messageData['URL']
            }]
        }

        let flag = await ad.insertData(fields);
        
        if (flag == 1) {
            fm.sendMessage(messageData['senderID'], formatMessageData);        
            res.status(200).send('OK');
        } else {
            fm.sendMessage(messageData['senderID'], 'Sorry, something went wrong, please try again.');        
            res.status(200).send('OK');
        } 
    } else if ((body['object'] === 'page' && messageData['messageText'] !== 'NO-DATA')) {

        let intentData = await gd.checkIntent(messageData['messageText']);
        let formatMessageData = formatMessage(intentData['fulfillmentMessages']);
        fm.sendMessage(messageData['senderID'], formatMessageData);
        res.status(200).send('OK');
    }
    else {
        fm.sendMessage(senderIDText['senderID'], 'I encountered a glitch.');
        res.status(200).send('OK');
    }
});

webApp.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});