import json
import boto3
import uuid
import datetime
import os

def lambda_handler(event, context):
    """
    Message Publisher Lambda - Receives complaints from Azure Function
    and publishes them to SQS queue
    """
    
    # Initialize AWS services
    sqs = boto3.client('sqs')
    dynamodb = boto3.resource('dynamodb')
    
    queue_url = os.environ['SQS_QUEUE_URL']
    message_logs_table = dynamodb.Table(os.environ['MESSAGE_LOGS_TABLE'])
    
    try:
        # Parse incoming data from Azure Function
        user_id = event.get('user_id', 'anonymous')
        message = event.get('message', '')
        issue_id = event.get('issue_id', str(uuid.uuid4()))
        
        if not message:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Message is required'})
            }
        
        # Create message for SQS
        message_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().isoformat()
        
        sqs_message = {
            'message_id': message_id,
            'user_id': user_id,
            'customer_message': message,
            'issue_id': issue_id,
            'timestamp': timestamp,
            'status': 'published'
        }
        
        # Send message to SQS queue
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(sqs_message),
            MessageAttributes={
                'user_id': {
                    'StringValue': user_id,
                    'DataType': 'String'
                },
                'timestamp': {
                    'StringValue': timestamp,
                    'DataType': 'String'
                }
            }
        )
        
        # Log the message in DynamoDB
        message_logs_table.put_item(Item={
            'message_id': message_id,
            'user_id': user_id,
            'customer_message': message,
            'issue_id': issue_id,
            'timestamp': timestamp,
            'status': 'published',
            'sqs_message_id': response['MessageId']
        })
        
        print(f"Message published successfully: {message_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Complaint published successfully',
                'message_id': message_id
            })
        }
        
    except Exception as e:
        print(f"Error publishing message: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to publish message'})
        }