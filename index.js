require('dotenv').config()
const fs = require('fs');
const pino = require('pino');
const cron = require('node-cron');
const axios = require('axios');
const axiosRetry = require('axios-retry');

// Set a max axios retry
axiosRetry(axios, {
    retries: 3
});

// Pipedrive & HubSpot API tokens
const PIPEDRIVE_TOKEN = process.env.PIPEDRIVE_TOKEN;
const HUBSPOT_API_KEY = process.env.HUBSPOT_API_Key;

const PIPEDRIVE_API_ENDPOINT = `https://api.pipedrive.com/v1/persons?api_token=${PIPEDRIVE_TOKEN}`;
const HUBSPOT_API_ENDPOINT = `https://api.hubapi.com/crm/v3/objects/contacts`;

// Set Pino Logger to write in a stream
const logStream = fs.createWriteStream('output.log', { flags: 'a'});
const logger = pino(logStream);

// Closes stream on exit
process.on('exit', () => {
    logStream.end();
});

// Get Contacts from HubSpot
async function getAllContactsFromHubSpot(){
    try{
        const response = await axios.get(HUBSPOT_API_ENDPOINT + '?properties=firstname,lastname,email,phone',
            {
                headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
                'Content-Type': 'application/json'
                }
            },
        )
        const contacts = response.data.results;
        return contacts;
    }catch(err){
        logger.error(err);
    }
    return null;

}

// Get contact from Hubspot by Id
async function getHubSpotContactById(id, properties){
    const url = properties ? HUBSPOT_API_ENDPOINT + '/' + id : HUBSPOT_API_ENDPOINT + '/' + id +'?properties=firstname,lastname,email,phone';
    try{
        const response = await axios.get(url,
            {
                headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
                'Content-Type': 'application/json'
                }
            },
        )
        const contact = response.data;
        
        return contact;
    }catch(err){
        logger.error(err);
    }
    return null;
}

// Get Persons from PipeDrive
async function getAllPersonsFromPipeDrive(){
    try{
        const response = await axios.get(PIPEDRIVE_API_ENDPOINT)
        const persons = response.data.data;
        
        return persons;
    } catch(err) {
        logger.error(err);
    }
    return null
}

// Create Hubspot contact
async function createHubspotContact(contact){
    try{
        const response = await axios.post(HUBSPOT_API_ENDPOINT,contact,
            {
                headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
                'Content-Type': 'application/json'
                }
            },
        )
        logger.info('Hubspot contact created');
    }catch(err){
        logger.error(err);
    }
}

// Create Pipedrive person
async function createPipedrivePerson(person){
    try{
        const response = await axios.post(PIPEDRIVE_API_ENDPOINT, person)
        
        logger.info('Pipedrive person created');
    } catch(err) {
        logger.error(err);
    }
}

// Sync contacts & persons
async function syncContacs(){
    const contacts = await getAllContactsFromHubSpot();
    const persons = await getAllPersonsFromPipeDrive();

    for(let contact of contacts){
        const isInArray = persons.some( person => person.primary_email === contact.properties.email);
        if (!isInArray){
            logger.info(`${contact.properties.email} doesn't exist in Pipedrive`);
            const person = contactToPerson(contact);
            createPipedrivePerson(person);
        }
    }

    for(let person of persons){
        const isInArray = contacts.some( contac => contac.properties.email === person.primary_email);
        if (!isInArray){
            logger.info(`${person.primary_email} doesn't exist in Hubspot`);
            const contact = personToContact(person);
            createHubspotContact(contact);
        }
    }
}

// Parse Hubspot Contact To Pipedrive Person
function contactToPerson(contact){
    const person = {
        name: `${contact.properties.firstname} ${contact.properties.lastname}`,
        first_name: contact.properties.firstname,
        last_name: contact.properties.lastname,
        email: [
            {
                label: "",
                primary: true,
                value: contact.properties.email
            }
        ],
        phone: [
            {
                label: "",
                primary: true,
                value: contact.properties.phone
            }
        ]
    }

    return person;
}

// Parse Pipedrive Person to Hubspot Contact
function personToContact(person){
    
    const contact = 
    {
        properties: {
            firstname: person.first_name,
            lastname: person.last_name,
            email: person.email.length > 0 ? person.email[0].value : '',
            phone: person.phone.length > 0 ? person.phone[0].value : '',
            company: person.org_id?.name
        }
    } 

    return contact;
}

// Running sync each 30 seconds on a cron task 
cron.schedule('30 * * * * *', () => {
    syncContacs();
});