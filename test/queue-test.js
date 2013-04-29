var vows = require('vows'),
    assert = require('assert');

var keys = require('./keys');
var SQS = require('../lib/sqs');

// Statics
var REGION = 'us-east-1';

/** Helper function to get the qualified queue */
var getQualifiedQueue = function (name, cb) {
  return function (messages, sqs) {
    this.sqs = (messages instanceof SQS) ? messages : sqs;
    if (!(messages instanceof SQS)) this.messages = messages;
    var that = this;
    this.sqs.listQueues(name, function (err, result) {
      if (!err) { 
        that.queue = result[0];
        cb.call(that); 
      } else that.callback(err);
    });
  };
};

// Create a Test Suite
vows.describe('Simple Queue Service').addBatch({
  'A queue' : {
    topic: new SQS(keys.id, keys.secret, {region: REGION}),

    'when creating a queue without attributes': {
      topic: function(sqs) {
        sqs.createQueue('testQueue', this.callback);
      },

      'results in new queue': function (err, result) {
        assert.isNull(err);
        assert.match(result, /\/\d+\/testQueue/);
      }
    },

    'when creating a queue with visibility timeout': {
      topic: function(sqs) {
        sqs.createQueue('testTimeoutQueue', {VisibilityTimeout : 120}, this.callback);
      },

      'results in new queue': function (err, result) {
        assert.isNull(err);
        assert.match(result, /\/\d+\/testTimeoutQueue/);
      }
    }
  }
}).addBatch({
  'A queue' : {
    topic: new SQS(keys.id, keys.secret, {region: REGION, altEndPoint: true}),

    'when creating a queue over an alternate endpoint': {
      topic: function(sqs) {
        sqs.createQueue('testAltEndpointQueue', {VisibilityTimeout : 120}, this.callback);
      },

      'results in new queue': function (err, result) {
        assert.isNull(err);
        assert.match(result, /\/\d+\/testAltEndpointQueue/);
      }
    }
  
  }
}).addBatch({
  'A queue' : {
    topic: new SQS(keys.id, keys.secret, {region: REGION}),

    'when retreiving a queue url': {
      topic: function(sqs) {
        sqs.getQueueUrl('testQueue', this.callback);
      },

      'results in correct url': function (err, result) {
        assert.isNull(err);
        assert.match(result, /https:\/{2}sqs\.[a-z0-9\-]+.amazonaws.com\/\d+\/testQueue/);
      }
    },
    'when retrieving list of queues': {
      topic: function(sqs) {
        sqs.listQueues(this.callback);
      },

      'results in array of queue names': function (err, result) {
        assert.isNull(err);
        assert.isArray(result);
        assert.isTrue(result.some(function (q) { return typeof(q) === 'string' && q.match(/\/\d+\/testQueue/); }));
      }
    },
    'when retrieving list of queues with prefix': {
      topic: function(sqs) {
        sqs.listQueues('testTimeout', this.callback);
      },

      'results in array of queue names': function (err, result) {
        assert.isNull(err);
        assert.isArray(result);
        assert.isTrue(result.some(function (q) { return typeof(q) === 'string' && q.match(/\/\d+\/testTimeoutQueue/); }));
        assert.isFalse(result.some(function (q) { return typeof(q) === 'string' && q.match(/\/\d+\/testQueue/); }));
      }
    }
  },
  'A message' : {
    topic: new SQS(keys.id, keys.secret, {region: REGION}),

    'when sending a message' : {
      topic: getQualifiedQueue('testQueue', function () {
        this.sqs.sendMessage(this.queue, 'this is a test message', this.callback);
      }),

      'results in information about message' : function(err, result) {
        assert.isNull(err);
        assert.isNotNull(result.MessageId);
      }
    },
    'when sending another message' : {
      topic: getQualifiedQueue('testTimeoutQueue', function () {
        this.sqs.sendMessage(this.queue, 'this is a timeout test message', this.callback);
      }),

      'results in information about message' : function(err, result) {
        assert.isNull(err);
        assert.isNotNull(result.MessageId);
      }
    }
  }
}).addBatch({
  'A message' : {
    topic: new SQS(keys.id, keys.secret, {region: REGION}),

    'when receiving a message' : {
      topic: getQualifiedQueue('testQueue', function () {
        this.sqs.receiveMessage(this.queue, this.callback);
      }),

      'results in message' : function(err, result) {
        assert.isNull(err);
        assert.equal(result[0].Body, 'this is a test message');
      }
    },
    'when receiving another message' : {
      topic: getQualifiedQueue('testTimeoutQueue', function () {
        this.sqs.receiveMessage(this.queue, this.callback);
      }),

      'after successfully reading the message' : {
        topic: getQualifiedQueue('testTimeoutQueue', function() {
          this.sqs.deleteMessage(this.queue, this.messages[0].ReceiptHandle, this.callback);
        }),
        'we can delete the message' : function(err, result) {
          assert.isNull(err);
        }
      }
    }
  }
}).addBatch({
  'A batch message' : {
    topic: new SQS(keys.id, keys.secret, {region: REGION}),

    'when sending a batch of messages' : {
      topic: getQualifiedQueue('testQueue', function () {
        this.sqs.sendMessageBatch(
          this.queue,
          [{message : 'foo'}, {message : 'bar'}],
          this.callback
        );
      }),

      'results in information about the messages sent' : function(err, result) {
        assert.isNull(err);
        assert.isArray(result);
        assert.lengthOf(result, 2);
        assert.equal(result[0].Id, '0');
        assert.equal(result[1].Id, '1');
      }
    }
  }
}).addBatch({
  'A queue' : {
    topic: new SQS(keys.id, keys.secret, {region: REGION}),

    'when requesting all queue attributes': {
      topic: getQualifiedQueue('testQueue', function () {
        this.sqs.getQueueAttributes(this.queue, this.callback);
      }),

      'results in information about the queue': function (err, result) {
        assert.isNull(err);
        assert.isObject(result);
        assert.includes(result, 'ApproximateNumberOfMessages');
      } 
    },

    'when requesting a single attribute': {
      topic: getQualifiedQueue('testQueue', function () {
        this.sqs.getQueueAttributes(
          this.queue, 
          ['ApproximateNumberOfMessages'], 
          this.callback);
      }),

      'results in information about that attribute': function (err, result) {
        assert.isNull(err);
        assert.isObject(result);
        assert.deepEqual(Object.keys(result), ['ApproximateNumberOfMessages']);
      }
    }
  }
}).addBatch({
  'A queue' : {
    topic: new SQS(keys.id, keys.secret, {region: REGION}),

    'when deleting a queue': {
      topic: getQualifiedQueue('testQueue', function () {
        this.sqs.deleteQueue(this.queue, this.callback);
      }),

      'results in success': function (err, result) {
        assert.isNull(err);
      }
    },
    'when deleting another queue': {
      topic: getQualifiedQueue('testTimeoutQueue', function () {
        this.sqs.deleteQueue(this.queue, this.callback);
      }),

      'results in success': function (err, result) {
        assert.isNull(err);
      }
    },
    'when deleting the alternate queue': {
      topic: getQualifiedQueue('testAltEndpointQueue', function () {
        this.sqs.deleteQueue(this.queue, this.callback);
      }),

      'results in success': function (err, result) {
        assert.isNull(err);
      }
    }
  }
}).export(module);