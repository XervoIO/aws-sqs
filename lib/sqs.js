var awsjs = require('aws-lib');

/*
AddPermission
ChangeMessageVisibility
ChangeMessageVisibilityBatch
CreateQueue - createQueue(name, [attrs], fn)
DeleteMessage - deleteMessage(queue, messageReceipt, fn)
DeleteMessageBatch - deleteMessageBatch(queue, messageReceipts, fn)
DeleteQueue - deleteQueue(name, fn)
GetQueueAttributes
GetQueueUrl - getQueueUrl(name, fn)
ListQueues - listQueues([prefix], fn)
ReceiveMessage - receiveMessage(queue, [opts], fn)
RemovePermission
SendMessage - sendMessage(queue, message, [delay], fn)
SendMessageBatch - sendMessageBatch(queue, messages)
SetQueueAttributes
*/

/**
 * Convience function for making a request to the SQS service.
 * @param  {object}   aws    AWS service from aws-lib.
 * @param  {string}   action The AWS action to invoke on the service.
 * @param  {object}   params The parameters to pass the action.
 * @param  {Function} fn Callback function from the service call, will include
 * an error (or null) and the result of the service call.
 * @private
 */
var makeCall = function(aws, action, params, fn) {
  aws.call(action, params, function(err, result) {
    if(!err && result && result.Error && result.Error.Message) {
      err = result.Error.Message;
    }
    fn(err, result);
  });
};

/**
 * Simple Queue Service, used to communicate and run commands against Amazon's
 * SQS.
 * @example
 *   var sqs = new SQS('awsId', 'awsSecret');
 * @param {string} accessKeyId key id
 * @param {string} secretAccessKey secret access key
 * @param {object} [opts] optional parameters
 * @config {string} [opts.region] the aws region, must be one of these:
 *   us-east-1, us-west-1, us-west-2, eu-west-1, ap-southeast-1, ap-northeast-1
 * @class
 */
var SQS = function(accessKeyId, secretAccessKey, opts) {

  // optional parameters
  opts = opts || {};
  this.accessKeyId = accessKeyId;
  this.secretAccessKey = secretAccessKey;
  this.region = opts.region || 'us-east-1';
  this.host = 'sqs.' + this.region + '.amazonaws.com';
};

/**
 * Create an SQSClient 
 * @param {?string} [version] WSDL version to use
 * @param {string} [path] Path of the queue to connect to
 * @returns {awsjs.SQSClient}
 */
SQS.prototype._createClient = function (version, path) {
  var params = { host : this.host, secure: true };
  if (version) params.version = version;
  if (path) params.path = path;

  return awsjs.createSQSClient(
    this.accessKeyId,
    this.secretAccessKey,
    params);
}

/**
 * Create a SQS queue
 * @param  {string} name The name of the queue
 *   Constraints: Maximum 80 characters; alphanumeric characters, hyphens (-),
 *   and underscores (_) are allowed.
 * @param  {object} [attrs] Attributes for the queue.
 * @config {number} [attrs.VisibilityTimeout] The length of time (in seconds) that a
 * message received from a queue will be invisible to other receiving components
 * when they ask to receive messages. For more information about
 * VisibilityTimeout, see Visibility Timeout in the Amazon SQS Developer Guide.
 * An integer from 0 to 43200 (12 hours). The default for this attribute is 30.
 * @config {string} [attrs.Policy] The formal description of the permissions for a resource.
 * For more information about Policy, see Basic Policy Structure in the Amazon
 * SQS Developer Guide. A valid form-url-encoded policy. For more information
 * about policy structure, see Basic Policy Structure in the Amazon SQS
 * Developer Guide. For more information about form-url-encoding,
 * see http://www.w3.org/MarkUp/html-spec/html-spec_8.html#SEC8.2.1.
 * @config {number} [attrs.MaximumMessageSize] The limit of how many bytes a message can
 * contain before Amazon SQS rejects it. An integer from 1024 bytes (1 KiB) up
 * to 65536 bytes (64 KiB). The default for this attribute is 65536 (64 KiB).
 * @config {number} [attrs.MessageRetentionPeriod] The number of seconds Amazon SQS retains a
 * message. Integer representing seconds, from 60 (1 minute) to 1209600
 * (14 days). The default for this attribute is 345600 (4 days).
 * @config {number} [attrs.DelaySeconds] The time in seconds that the delivery of all messages
 * in the queue will be delayed. An integer from 0 to 900 (15 minutes). The
 * default for this attribute is 0 (zero).
 * @param  {Function} fn Callback function for when queue is created, Callback
 * function takes two parameters error and result, result will be full name
 * for the queue.
 * @link SQS.prototype.deleteQueue
 */
SQS.prototype.createQueue = function(name, attrs, fn) {
  if(!fn) {
    fn = attrs;
    attrs = null;
  }

  // Check name to make sure meets constraints
  if(name.length > 80 || name.search(" ") != -1) {
    fn('Name is constrained to maximum 80 characters; ' +
       'alphanumeric characters, hyphens (-), and underscores (_).', null);
    return;
  }

  var params = {
    QueueName : name
  };

  if(attrs) {
    var i = 1;
    for(var prop in attrs) {
      params["Attribute." + i + ".Name"] = prop;
      params["Attribute." + i + ".Value"] = attrs[prop];
      i++;
    }
  }

  var host = this.host;
  var aws = this._createClient('2011-10-01');

  makeCall(aws, 'CreateQueue', params, function(err, result) {
    var url = '';

    if(result && result.CreateQueueResult) {
      url = result.CreateQueueResult.QueueUrl;
    }

    var name = url.replace('https://' + host, '');

    fn(err, name);
  });
};

/**
 * Deletes a SQS queue.
 * @param  {string} name The full name for the queue, should be something like
 * /12312301239/nameOfQueue.
 * @param  {Function} fn Callback function for when queue is created
 *   Callback function takes one parameter, error
 * @link SQS.prototype.createQueue
 */
SQS.prototype.deleteQueue = function(name, fn) {
  var aws = this._createClient('2011-10-01', name);

  makeCall(aws, 'DeleteQueue', {}, function(err, result) {
    fn(err);
  });
};

/**
 * Returns the full qualified url for a queue.
 * @param  {string} name The full name of the queue, should be something like
 * /12312301239/nameOfQueue.
 * @param  {Function} fn The callback for when the url is retrieved, Callback
 * function should take two parameters, error and result which is queue url
 * @link SQS.prototype.listQueues
 */
SQS.prototype.getQueueUrl = function(name, fn) {
  var aws = this._createClient('2011-10-01');
  var params = {
    QueueName : name
  };
  makeCall(aws, 'GetQueueUrl', params, function(err, result) {
    var url = '';
    if(result && result.GetQueueUrlResult) {
      url = result.GetQueueUrlResult.QueueUrl;
    }
    fn(err, url);
  });
};

/**
 * Returns a list of available queues.
 * @param  {string} [prefix] Queue name prefix to filter the list of queues to
 * return.
 * @param  {Function} fn The callback for when the queue list is retrieved,
 * Callback function should take two parameters, error and result which is
 * an array of queue names
 * @link SQS.prototype.getQueueUrl
 */
SQS.prototype.listQueues = function(prefix, fn) {
  if(!fn) {
    fn = prefix;
    prefix = null;
  }

  var host = this.host;

  var aws = this._createClient('2011-10-01');

  var params = {};
  if(prefix) {
    params.QueueNamePrefix = prefix;
  }

  makeCall(aws, 'ListQueues', params, function(err, result) {
    var urls = [];
    if(result && result.ListQueuesResult) {
      urls = result.ListQueuesResult.QueueUrl;

      if(typeof urls === 'string') {
        urls = [urls];
      }
    }

    if (urls) {
      for(var i = 0; i < urls.length; i++) {
        urls[i] = urls[i].replace('https://' + host, '');
      }
    }
    fn(err, urls);
  });
};

/**
 * Sends a message to a queue.
 * @param  {string} queue The full name of the queue. Should be something like
 * /12312301239/nameOfQueue.
 * @param  {string} message The message to add to the queue.
 * @param  {number} [delay] The delay to wait before the message is actually
 * visible in the queue.
 * @param  {Function} fn The callback for when the message is add to queue,
 * Callback function should take two parameters, error and result which is
 * and the message details.
 * @link SQS.prototype.sendMessageBatch
 */
SQS.prototype.sendMessage = function(queue, message, delay, fn) {
  if(!fn) {
    fn = delay;
    delay = null;
  }

  var aws = this._createClient(null, queue);

  var params = {
    MessageBody : message
  };

  if(delay) {
    params.DelaySeconds = delay;
  }

  makeCall(aws, 'SendMessage', params, function(err, result) {
    if(err) {
      fn(err, null);
    } else {
      var ret = null;
      if(result.SendMessageResult) {
        ret = result.SendMessageResult;
      }
      fn(err, ret);
    }
  });
};

/**
 * Sends a batch of messages to a queue.
 * @param  {string} queue The full name of the queue. Should be something like
 * /12231231231/nameOfQueue.
 * @param  {Array} messages An array of objects, each object should have
 * message property and optional delay property.
 * @param  {Function} fn The callback for when the message is add to queue,
 * Callback function should take two parameters, error and result which is
 * an array of message details.
 * @link SQS.prototype.sendMessage
 */
SQS.prototype.sendMessageBatch = function(queue, messages, fn) {
  var aws = this._createClient('2011-10-01', queue);

  var params = {};

  for (var i = 0; i < messages.length; i++) {
    var index = i + 1;
    params['SendMessageBatchRequestEntry.' + index + '.Id'] = i;
    params['SendMessageBatchRequestEntry.' + index + '.MessageBody'] = messages[i].message;
    if(messages[i].delay) {
      params['SendMessageBatchRequestEntry.' + index + '.DelaySeconds'] = messages[i].delay;
    }
  }

  makeCall(aws, 'SendMessageBatch', params, function(err, result) {
    if(err) {
      fn(err, null);
    } else {
      var ret = null;
      if(result.SendMessageBatchResult &&
         result.SendMessageBatchResult.SendMessageBatchResultEntry)
      {
        ret = result.SendMessageBatchResult.SendMessageBatchResultEntry;
      }
      fn(err, ret);
    }
  });
};

/**
 * Retrieves any messages from a queue if any are available. If none are
 * available then an empty array is returned as the result.
 * @param  {string} queue The full name of the queue to check for messages,
 * should look something like /12312301239/nameOfQueue.
 * @param  {object} [opts] Options for retreiving messages.
 * @config {number} [opts.MaxNumberOfMessages] The max number of messages to pull
 * from queue.
 * @config {number} [opts.VisibilityTimeout] The length of time in seconds that a
 * message is not visible for receive requests after returned from this one.
 * @param  {Function} fn The callback for when the message(s) are pulled from
 * queue, Callback function should take two parameters, error and result which
 * is an array of messages.
 * @link SQS.prototype.sendMessage
 */
SQS.prototype.receiveMessage = function(queue, opts, fn) {
  if(!fn) {
    fn = opts;
    opts = null;
  }

  var aws = this._createClient(null, queue);

  var params = {};

  if(opts && opts.MaxNumberOfMessages) {
    params.MaxNumberOfMessages = opts.MaxNumberOfMessages;
  }

  if(opts && opts.VisibilityTimeout) {
    params.VisibilityTimeout = opts.VisibilityTimeout;
  }

  if(opts && opts.attrs) {
    for (var i = 1; i <= opts.attrs.length; i++) {
      params["AttributeName." + i] = opts.attrs[i-1];
    }
  }

  makeCall(aws, 'ReceiveMessage', params, function(err, result) {
    if(err) {
      fn(err, null);
    } else {
      var messages = null;
      if(result.ReceiveMessageResult && result.ReceiveMessageResult.Message) {
        if(result.ReceiveMessageResult.Message.length) {
          messages = result.ReceiveMessageResult.Message;
        } else {
          messages = [result.ReceiveMessageResult.Message];
        }
      }
      if(messages !== null) {
        for(var i = 0; i < messages.length; i++) {
          var message = messages[i];
          if(message.Attribute && message.Attribute.length) {
            for(var j = 0; j < message.Attribute.length; j++) {
              message[message.Attribute[j].Name] = message.Attribute[j].Value;
            }
          } else {
            if(message.Attribute) {
              message[message.Attribute.Name] = message.Attribute.Value;
            }
          }
        }
      }
      fn(err, messages);
    }
  });
};

/**
 * Deletes a message from a queue.
 * @param  {string} queue The full name of the queue to delete the
 * message from, name should be something like /1212412123/nameOfQueue.
 * @param {string} messageReceipt The message receipt of the message to
 * delete.
 * @param  {Function} fn Callback function for deleting a message, callback will
 * include an err (or null).
 * @link SQS.prototype.deleteMessage
 */
SQS.prototype.deleteMessage = function(queue, messageReceipt, fn) {
  var aws = this._createClient(null, queue);

  var params = {
    ReceiptHandle : messageReceipt
  };

  makeCall(aws, 'DeleteMessage', params, function(err, result) {
    fn(err);
  });
};

/**
 * Deletes a batch of messages from a queue.
 * @param  {string} queue The full name of the queue to delete the
 * message from, name should be something like /1212412123/nameOfQueue.
 * @param  {Array} messageReceipts An array of message receipts to delete from
 * the queue.
 * @param  {Function} fn Callback function for deleting messages, callback will
 * include an err (or null).
 * @link SQS.prototype.deleteMessageBatch
 */
SQS.prototype.deleteMessageBatch = function(queue, messageReceipts, fn) {
  var aws = this._createClient('2011-10-01', queue);

  var params = {};

  for(var i = 1; i <= messageReceipts.length; i++) {
    params['DeleteMessageBatchRequestEntry.'  + i + '.Id'] = 'message_' + i;
    params['DeleteMessageBatchRequestEntry.'  + i + '.ReceiptHandle'] = messageReceipts[i-1];
  }

  makeCall(aws, 'DeleteMessageBatch', params, function(err, result) {
    fn(err);
  });
};

/** Export module **/
module.exports = SQS;
