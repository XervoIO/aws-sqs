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