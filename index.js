var config = require('./config.js')
var AWS = require('aws-sdk');
var HttpStatus = require('http-status-codes');
var docClient = new AWS.DynamoDB.DocumentClient({region: config.region});
var DYNAMODB_ERROR_CONDITIONAL_CHECK = "ConditionalCheckFailedException"

// custom error returns
// using http status messages here in case AWS API Gateway is in play in front of this Lambda, response mapping to appropriate status codes
// in the API gateway occurs using regex
//
var messageNotFound = function(key) {
    return HttpStatus.getStatusText(HttpStatus.NOT_FOUND) + " : " + key;
};

var messageServerError = function(err) {
    return HttpStatus.getStatusText(HttpStatus.INTERNAL_SERVER_ERROR) + " : " + err;
};

var messageConflict = function(err) {
  return HttpStatus.getStatusText(HttpStatus.CONFLICT) + " : " + err;
};

var messageBadRequest = function(err) {
  return HttpStatus.getStatusText(HttpStatus.BAD_REQUEST) + " : " + err;
};

var messageSucceded = function(code, message, results) {
    return {
        statusCode: code,
        status: message,
        data: results
      };
};

var conditionExpressionNotExists = function(key) {
    return "attribute_not_exists(" + config.keyName + ")";
}

var _run = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));
    var operation = event.operation;
    var body = event.body;
    var id = event[config.keyName];
    var params = {Key: {}, TableName: config.table};
    params.Key[config.keyName] = event[config.keyName];

    switch (operation) {
        case 'create':
            delete params.Key;
            params.Item = config.defaultCreate;
            params.Item[config.keyName] = id;
            params.ConditionExpression = conditionExpressionNotExists(config.keyName); //dont double create

            // update default create with any keys from the post body
            // ignores keys we dont know about
            for (var i=0; i<config.keys.length; i++) {
              if (body.hasOwnProperty(config.keys[i])) {
                params.Item[config.keys[i]] = body[config.keys[i]];
              }
            };

            docClient.put(params, function(err, res) {
                if (err) {
                  if (DYNAMODB_ERROR_CONDITIONAL_CHECK === err.code) {
                    context.fail(messageConflict(err));
                  } else {
                    context.fail(messageServerError(err));
                  }
                } else {
                  context.succeed(messageSucceded(HttpStatus.CREATED,HttpStatus.getStatusText(HttpStatus.CREATED), params.Item)); //note we return full Item created
                }
              });
            break;
        case 'read':
            docClient.get(params, function(err, res) {
                if (err) {
                  context.fail(messageServerError(err));
                } else {
                  if (!Object.keys(res).length) {
                    context.fail(messageNotFound(id));
                  } else {
                    context.succeed(messageSucceded(HttpStatus.OK,HttpStatus.getStatusText(HttpStatus.OK),res.Item));
                  }
                }
              });
            break;
        case 'update':
            var attributeUpdates = {};
            // this update will also function as a CREATE?
            // update valid keys that were sent
            for (var i=0; i<config.keys.length; i++) {
              if (body.hasOwnProperty(config.keys[i]))  {
                attributeUpdates[config.keys[i]] = { Action: 'PUT', Value: body[config.keys[i]]};
              }
            };

            if (!Object.keys(attributeUpdates).length) {
              context.fail(messageBadRequest('no valid keys for update in body'));
            } else {
              params.AttributeUpdates = attributeUpdates;
              params.ReturnValues = "ALL_NEW"
              docClient.update(params, function(err, res) {
                if (err) {
                  context.fail(messageServerError(err));
                } else {
                  context.succeed(messageSucceded(HttpStatus.OK,HttpStatus.getStatusText(HttpStatus.OK),res.Attributes));
                }
              });
            };
            break;
        case 'delete':
            docClient.delete(params, function(err, res) {
              if (err) {
                context.fail(messageServerError(err));
              } else {
                context.succeed(messageSucceded(HttpStatus.OK,HttpStatus.getStatusText(HttpStatus.OK),res)); //Note : not using 204 No Content here
              }
            });
            break;
        default:
            context.fail(messageServerError('unrecognized operation - '+operation));
    }
};

exports.handler = function(event, context) {
  _run(event, context);
};

// eg. $>node index.js test create
//     will run an integration test locally
var first_value = process.argv[2];
var second_value = process.argv[3];
if ("test" === first_value) {
  switch (second_value) {
      case 'create':
        _run( config.test.fake_event_create, config.test.fake_context );
        break;
      case 'delete':
        _run( config.test.fake_event_delete, config.test.fake_context );
        break;
      case 'update':
        _run( config.test.fake_event_update, config.test.fake_context );
        break;
      case 'read':
        _run( config.test.fake_event_read, config.test.fake_context );
        break;
      default:
        _run( config.test.fake_event_read, config.test.fake_context );
  };
}
