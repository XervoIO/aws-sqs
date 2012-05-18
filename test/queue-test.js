var vows = require('vows'),
    assert = require('assert');

var keys = require('./keys');
var SQS = require('../lib/sqs');

// Create a Test Suite
vows.describe('Simple Queue Service').addBatch({
  'A queue' : {
    topic: new SQS(keys.id, keys.secret),

    'when creating a queue without attributes': {
      topic: function(sqs) {
        sqs.createQueue('testQueue', this.callback);
      },

      'results in new queue': function (err, result) {
        assert.isNull(err);
        assert.equal(result, '/158798613855/testQueue');
      }
    },
    'when creating a queue with visibility timeout': {
      topic: function(sqs) {
        sqs.createQueue('testTimeoutQueue', {VisibilityTimeout : 120}, this.callback);
      },

      'results in new queue': function (err, result) {
        assert.isNull(err);
        assert.equal(result, '/158798613855/testTimeoutQueue');
      }
    }
  }
}).addBatch({
  'A queue' : {
    topic: new SQS(keys.id, keys.secret),

    'when retreiving a queue url': {
      topic: function(sqs) {
        sqs.getQueueUrl('testQueue', this.callback);
      },

      'results in correct url': function (err, result) {
        assert.isNull(err);
        assert.equal(result, 'https://sqs.us-east-1.amazonaws.com/158798613855/testQueue');
      }
    },
    'when retrieving list of queues': {
      topic: function(sqs) {
        sqs.listQueues(this.callback);
      },

      'results in array of queue names': function (err, result) {
        assert.isNull(err);
        assert.notDeepEqual(result, ['/158798613855/testQueue']);
      }
    },
    'when retrieving list of queues with prefix': {
      topic: function(sqs) {
        sqs.listQueues('testTimeout', this.callback);
      },

      'results in array of queue names': function (err, result) {
        assert.isNull(err);
        assert.notDeepEqual(result, ['/158798613855/testQueue', '/158798613855/testTimeoutQueue']);
      }
    }
  },
  'A message' : {
    topic: new SQS(keys.id, keys.secret),

    'when sending a message' : {
      topic: function(sqs) {
        sqs.sendMessage('/158798613855/testQueue', 'this is a test message', this.callback);
      },

      'results in information about message' : function(err, result) {
        assert.isNull(err);
        assert.isNotNull(result.MessageId);
      }
    },
    'when sending another message' : {
      topic: function(sqs) {
        sqs.sendMessage('/158798613855/testTimeoutQueue', 'this is a timeout test message', this.callback);
      },

      'results in information about message' : function(err, result) {
        assert.isNull(err);
        assert.isNotNull(result.MessageId);
      }
    }
  }
}).addBatch({
  'A message' : {
    topic: new SQS(keys.id, keys.secret),

    'when receiving a message' : {
      topic: function(sqs) {
        sqs.receiveMessage('/158798613855/testQueue', this.callback);
      },

      'results in message' : function(err, result) {
        assert.isNull(err);
        assert.equal(result[0].Body, 'this is a test message');
      }
    },
    'when receiving another message' : {
      topic: function(sqs) {
        sqs.receiveMessage('/158798613855/testTimeoutQueue', this.callback);
      },

      'after successfully reading the message' : {
        topic : function(messages, sqs) {
          sqs.deleteMessage('/158798613855/testTimeoutQueue', message[0].ReceiptHandle, this.callback);
        },
        'we can delete the message' : function(err, result) {
          assert.isNull(err);
        }
      }
    }
  }
}).addBatch({
  'A queue' : {
    topic: new SQS(keys.id, keys.secret),

    'when deleting a queue': {
      topic: function(sqs) {
        sqs.deleteQueue('/158798613855/testQueue', this.callback);
      },

      'results in success': function (err, result) {
        assert.isNull(err);
      }
    },
    'when deleting another queue': {
      topic: function(sqs) {
        sqs.deleteQueue('/158798613855/testTimeoutQueue', this.callback);
      },

      'results in success': function (err, result) {
        assert.isNull(err);
      }
    }
  }
}).export(module);