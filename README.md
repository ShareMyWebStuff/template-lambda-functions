# template-lambda-functions

**Note: please see the template-aws-infrastructure before using this**

This repository handles the coding and deployment of the lambda functions associated with this project. 

The lambda functions are the serverless items that are called via the API gateway or from other events.

This repository contains the code for the lambda functions and the api gateway.

## Repository Structure

File / Directory | Description
-----------------|-------------
__ tests __ | directory  contains all the jest tests for this repository.
events | This directory contains the event files which are used to test the lambda functions locally.
.env | This file contains the connectivity details for the local database etc for the jest tests.
env.json | This contains the connectivity details for the lambda function when run via the api gateway locally.

## Prerequisites

Before running or deploying the lambda functions the following needs to be deployed
* Lambda Layers
* The database items

## Packaging and Deploying

To package and deploy you require an S3 bucket to deploy from. This can be created via the console or the AWS CLI
> aws s3 mb s3://${BUCKET}

To package the this up
aws cloudformation package --template-file template.yml --s3-bucket sharemytutoring-sam --output-template template-export.yml

To deploy this code
aws cloudformation deploy  --template-file template-export.yml --stack-name sharemytutoring --capabilities CAPABILITY_IAM

## Testing

This repository has a test folder __test__ in the root directory. This contains all the unit and integration tests for the backend functionality. To run the tests run the following command

npm run test

## Local Run

In order to develop you will need to run both the react and backend on your PC whilst you develop. To run the backend locally you run the below command, although you will need to upload the layers first (SAM can only extract the layers from AWS and not read from your local PC or repository). React and the local gateway run on the same port, so to get them running together you will need to change the port one of them runs on. Below it is set to run on port 3002.

sam local start-api --env-vars env.json --port 3002

Each of the functions needs to have its environment variables set. This is done in the env.json file.

## Lambda Functions 

In you want to run the lambda functions from the AWS console you will need to enter the parameters required for each of the functions

{
    "httpMethod": "POST",
    "body": "{\"email\": \"dave@har.com\", \"username\": \"DaveFromWoking123\",\"password\": \"London01\",\"password2\": \"London01\",\"type\": \"1\"}"
}

