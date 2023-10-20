# Bi-directional Sync between Pipedrive and HubSpot

## Introduction

This program provides a utility to synchronize contacts between HubSpot and Pipedrive. By using this, any contact that's present in one platform but not the other will be created, ensuring both platforms maintain a consistent set of contacts.



### Prerequisites

Follow these steps to get the application up and running:

- Node.js environment 
- **axios**, **axios-retry**, **pino**,** node-cron**, and **dotenv** npm packages installed.
- Valid API tokens for both HubSpot and Pipedrive.

### Configuration
To setup, store the HubSpot and Pipedrive API tokens in a '.env' file in the root directory:
```
PIPEDRIVE_TOKEN=<Your_Pipedrive_Token>
HUBSPOT_API_Key=<Your_HubSpot_API_Key>
```

### Overview

1. Initialization:
	- Setup axios retries usin axios-retry
	- Load environmental variables.
	- Setup logging using Pino.
	- Setup the API endpoints for HubSpot and Pipedrive.

2. Functions:
	- *getAllContactsFromHubSpot* : Fetches all contacts from HubSpot.
	
	- *getHubSpotContactById* : Fetches a specific contact from HubSpot by ID.
	
	- *getAllPersonsFromPipeDrive* : Fetches all persons from Pipedrive.
	
	- *createHubspotContact* : Creates a new contact in HubSpot.
	
	- *createPipedrivePerson* : Creates a new person in Pipedrive.
	
	- *syncContacs* : Orchestrates the synchronization process between HubSpot and Pipedrive.
	
	- *contactToPerson* : Converts a HubSpot contact to a Pipedrive person format.
	
	- *personToContact* : Converts a Pipedrive person to a HubSpot contact format.
	
3. Synchronization Logic:
	- For each HubSpot contact:
		- If not present in Pipedrive, create a new person in Pipedrive.
	- For each Pipedrive person:
		- If not present in HubSpot, create a new contact in HubSpot.

4. Scheduling:
	- The *syncContacts* function is scheduled to run every 30 seconds.

### Logging

All activities, including errors, are logged to the **output.log** file. This ensures that you can trace back any issues or review synchronization activities.

### Error Handling

The program logs errors instead of halting the process. If there's an error with any specific contact or person, the program will log the error and proceed with the next item.

### License

This project is licensed under the MIT License.