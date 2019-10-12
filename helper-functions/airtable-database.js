const axios = require('axios');
require('dotenv').config();

const APP_ID = process.env.APP_ID;
const API_KEY = process.env.API_KEY;

const insertData = async (fields) => {

    let url = `https://api.airtable.com/v0/${APP_ID}/UploadImage`;
    let headers = {
        'Authorization': 'Bearer '+API_KEY,
        'Content-Type': 'application/json'
    }

    let response = await axios.post(url, {fields}, {headers});

    if (response.status == 200) {
        return 1;
    } else {
        return 0;
    }
};

module.exports = {
    insertData
}