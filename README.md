# Fithun Application

## Getting Started

### Prerequisites

1. Node.js (v16.0.0 or Above)
2. npm i

## Installation

1. Run `npm i` in your terminal to install all dependencies.
2. Run `node index.js` or `nodemon` in your terminal to run the local server.

## Environment Variables

Ensure you fill in the respective values for each environment variable in your `.env` file.

```dotenv
port=2045
hostAddress=localhost:2029
databasePort=27017
databaseName=planetspark
databaseHostLocal=127.0.0.1
databaseHost=planetspark
dbUserName=planetspark
dbPass=planetspark
jwtsecret=nodejwt
jwtresetsecret=nodejwt

nodemailer_service=gmail
nodemailer_email=Your 2 step verification credential
nodemailer_password=Your 2 step verification credential

jwtOptions_expiresIn=24h

swaggerDefinition_info_title=planetspark-node
swaggerDefinition_info_version=2.0
swaggerDefinition_info_description=planetspark-API Docs
swaggerDefinition_basePath=/api/v1
swaggerDefinition_securityDefinitions_tokenauth_type=apiKey
swaggerDefinition_securityDefinitions_tokenauth_name=Authorization
swaggerDefinition_securityDefinitions_tokenauth_in=header

cloudinary_cloud_name=your cloudinary credentials
cloudinary_api_key=your cloudinary credentials
cloudinary_api_secret=your cloudinary credentials
