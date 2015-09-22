### lambda-generic-microservice

AWS Lambda microservice for CRUD on any dynamoDB objects.
Can (and probably should) be paired with an AWS API Gateway.

### Lambda Usage
You may use this Lambda as is sending custom events with operation types of create, read, update, and delete.
The event must contain a hash key as configured in the ```config.js```
Only event keys in the ```config.keys``` list will be processed on create/update.
Create and update are friendly (each is PATCH secretly) and do not require a full object to complete successfully.

#### Example Events and Response

##### create
```
event
{
  "operation": "create",
  "mykey": "ZZZZZZZZZZZZZZZZZ",
  "body": {}
}

response
{
  "statusCode": 201,
  "status": "Created",
  "data": {
    "mykey": "ZZZZZZZZZZZZZZZZZ",
    "location": "unknown",
    "cost": 0
  }
}
```

#### read  
```
event
{
  "operation": "read",
  "mykey": "ZZZZZZZZZZZZZZZZZ"
}

response
{
  "statusCode": 200,
  "status": "Ok",
  "data": {
    "mykey": "ZZZZZZZZZZZZZZZZZ",
    "location": "unknown",
    "cost": 0
  }
}
```

#### update  
```
event
{
  "operation": "update",
  "mykey": "ZZZZZZZZZZZZZZZZZ",
  "body": {
    "location":"taco bell"
  }
}

response
{
  "statusCode": 200,
  "status": "Ok",
  "data": {
    "mykey": "ZZZZZZZZZZZZZZZZZ",
    "location": "taco bell",
    "cost": 0
  }
}
```

#### delete
```
event
{
  "operation": "delete",
  "mykey": "ZZZZZZZZZZZZZZZZZ"
}

response
{
  "statusCode": 200,
  "status": "OK",
  "data": {}
}
```

#### Exceptions and Errors  
The Lambda function will return errors with the following format, designed to be regex-able by AWS API Gateway to turn into a matching HttpStatus and formated response object. For example a double create will return "Conflict" so that the API Gateway can map this to HttpStatus and HttpStatusCode Conflict - 409.

```
{  "errorMessage": "<Http Status Text> : <Lambda error message>" }
eg.
{  "errorMessage": "Conflict : ConditionalCheckFailedException: The conditional request failed" }
```

### Configuration
```index.js``` is agnostic to the data in the object and dynamoDB. This code will work against any table or hash keys as declared in the config.js file.

- table     : dynamoDB table name
- keyName   : name of hash key in the dynamoDB
- keys      : valid hash keys for this dynamoDB table
- defaultCreate : default values for new records

eg.
```
config = {
  region: 'us-east-1',
  table: 'Lunch',
  keyName: 'mykey',
  keys: ['cost', 'location'],
  defaultCreate: {
    mykey: null,
    location: "unknown",
    cost: 0
  }
}
```

### Using with API Gateway
To make this into a more friendly REST API you can setup GET/POST/PUT/DELETE methods in an API Gateway.

#### Request mapping
Using integration request methods to map url or query params into the event object passed to Lambda.

##### Examples:
request - ```GET - /<api host>/<api stage>/lunch/:mykey```  
```
// mapper in API Gateway
{ "operation":"read", "mykey":"$input.params('mykey')" }  

// example event passed to lambda  
{ "operation":"read", "mykey":"123456789101212" }  
```

request ```POST - /<api host>/<api stage>/lunch/:mykey```
body
```
// mapper in API Gateway
{ "operation":"create", "mykey":"$input.params('mykey')", "body":$input.json('$') }

// exaple event passed to lambda
{
  "operation":"create",
  "mykey":"123456789101212",
  "body": {
    location: "desk",
    cost: 0,
  }
}
```

#### Response mapping
Using integration response methods you can map error messages and responses from the lambda to appropriate HttpStatus codes and messages.

##### Example (error response):
```
//response from lambda  
{  "errorMessage": "Conflict : ConditionalCheckFailedException: The conditional request failed" }

//regex rule in API Gateway response integration mapping  
Conflict.*

//mapper in API Gateway
{ "status" : "CONFLICT", "errorMessage": "$input.path('errorMessage')", "statusCode":409 }

//response from API Gateway  
application/json  
409  
{ "status" : "CONFLICT",
  "errorMessage": "Conflict : ConditionalCheckFailedException: The conditional request failed",
  "statusCode":409
}
```

#### Deployment
The ```deploy``` directory contains shell scripts to create and upload a Lambda function as well as set policy on it. AWS cli installation and properly configured aws credentials on a must for this shell to work.

No CLI exists for API gateway at this time.

#### Needed/Potential Improvements  
- Lambda should just return object on success, let the gateway map to a success object.
- some real tests?
- once aws-cli has api gateway commands, make a full create/teardown script so people can quickly play with this
- consider being stricter about PATCH/PUT/POST?

#### Reference
[AWS Lambda Documentation](https://aws.amazon.com/lambda/)
[AWS API Gateway](https://aws.amazon.com/api-gateway/)
[AWS DyanmoDB](https://aws.amazon.com/dynamodb/)

This is very much based on the http-microservice lambda example titled "microservice-http-endpoint" provided by AWS.
Their blueprint as of writing this README was the old ```dynamodb-doc``` node package instead of the AWS stated preferred usage of ```AWS.DynamoDB.DocumentClient``` in the regular aws-sdk for node. I followed this update and did not use ```dynamodb-doc```. Read more [here](https://blogs.aws.amazon.com/javascript/post/Tx1OVH5LUZAFC6T/Announcing-the-Amazon-DynamoDB-Document-Client-in-the-AWS-SDK-for-JavaScript) 
