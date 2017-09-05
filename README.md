[![build status](https://secure.travis-ci.org/XervoIO/aws-sqs.png)](http://travis-ci.org/XervoIO/aws-sqs)

aws-sqs
=======

AWS Simple Queue Service library for Node.js

## Install

    npm install aws-sqs

## Docs
You can checkout the class documentation at [SQS Class](http://onmodulus.github.com/aws-sqs/symbols/SQS.html).

## Simple usage

    var sqs = new SQS('awsId', 'awsSecret');
    sqs.createQueue('testTimeoutQueue', {VisibilityTimeout : 120}, function(err, res) {
      if(err) {
        //handle error
      }
      console.log(res); // something like /158795553855/testTimeoutQueue
    });

## Testing

Before run tests, edit test/keys.js **or** export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY 
environment variables with your AWS Credentials.

