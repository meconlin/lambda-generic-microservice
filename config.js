//  microservice lambda config
//
//  Change DynamoDB setup to use this index.js with a different dynamoDB
//  table     : dynamoDB table name
//  keyName   : name of hash key in the dynamoDB
//  keys      : valid hash keys for this dynamoDB table
//  defaultCreate : blank object for creates, this is object.new for your records
//

var config = {};
config = {
  region: 'us-east-1',
  table: 'Lunch',
  keyName: 'mykey',
  keys: ['location', 'cost'],
  defaultCreate: {
    mykey: null,
    location: "unknown",
    cost: 0
  }
}


// test objects for runing locally
//
config.test = {};
config.test.fake_context = {
                            done: function(err, value){ console.log('done : ',err, value);},
                            succeed: function( err, value ){ console.log('succed', err, value)},
                            fail: function(err, value){ console.log('fail', err, value)}};

config.test.fake_event_read = {
  operation: "read",
  mykey: "ZZZZZZZZZZZZZZZZA"
};

config.test.fake_event_delete = {
  operation: "delete",
  mykey: "ZZZZZZZZZZZZZZZZA"
};

config.test.fake_event_create = {
  operation: "create",
  mykey: "ZZZZZZZZZZZZZZZZA",
  body: {
    location: "taco bell"
  }
};

config.test.fake_event_update = {
  operation: "update",
  mykey: "ZZZZZZZZZZZZZZZZA",
  body: {
    location: "waffle house",
    cost: 9
  }
};

module.exports = config;
