// Requiered Packages
const dialogflow = require('dialogflow');
const fs = require('fs');
require('dotenv').config();

// Session ID, it can be any string
// We store it in a separate file
const sessionId = fs.readFileSync('key.text').toString();

// Your google dialogflow project-id
const projectId = process.env.PROJECT_ID;

// Your credentials
const jsonData = JSON.parse(process.env.CREDENTIALS);

const config = {
    credentials: {
        private_key: jsonData['private_key'],
        client_email: jsonData['client_email']
    }
}

// Create a session client
const sessionClient = new dialogflow.SessionsClient(config);
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

const checkIntent = async (text) => {

    let request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: 'en-US',
            }
        }
    };

    let response = await sessionClient.detectIntent(request);
    let intent = response[0]['queryResult']['intent']['displayName'];
    let fulfillmentMessages = response[0]['queryResult']['fulfillmentMessages'][0];
    let outputContexts = response[0]['queryResult']['outputContexts'];

    return {
        'intent': intent,
        'fulfillmentMessages': fulfillmentMessages,
        'outputContexts': outputContexts
    };
};

module.exports = {
    checkIntent
}