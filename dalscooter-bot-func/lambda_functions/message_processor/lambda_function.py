import json
import boto3
import random
import datetime
import os

def lambda_handler(event, context):
    """
    Message Processor Lambda - Triggered by SQS queue
    Forwards messages to random franchise operators
    """
    
    dynamodb = boto3.resource('dynamodb')
    message_logs_table = dynamodb.Table(os.environ['MESSAGE_LOGS_TABLE'])
    
    # List of franchise operators (in real app, this would come from database)
    franchise_operators = [
        'operator001@dalscooter.com',
        'operator002@dalscooter.com', 
        'operator003@dalscooter.com',
        'operator004@dalscooter.com'
    ]
    
    try:
        # Process each SQS message
        for record in event['Records']:
            # Parse the SQS message
            message_body = json.loads(record['body'])
            
            message_id = message_body['message_id']
            user_id = message_body['user_id']
            customer_message = message_body['customer_message']
            timestamp = message_body['timestamp']
            
            # Select random franchise operator
            assigned_operator = random.choice(franchise_operators)
            
            # Simulate forwarding to operator (in real app, send email/notification)
            print(f"Forwarding message {message_id} to operator: {assigned_operator}")
            print(f"Customer message: {customer_message}")
            
            # Update message log with operator assignment
            message_logs_table.update_item(
                Key={'message_id': message_id},
                UpdateExpression='SET #status = :status, assigned_operator = :operator, forwarded_at = :forwarded_time',
                ExpressionAttributeNames={
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':status': 'forwarded',
                    ':operator': assigned_operator,
                    ':forwarded_time': datetime.datetime.utcnow().isoformat()
                }
            )
            
            # Simulate operator response (for demo purposes)
            # In real app, this would be a separate process when operator actually responds
            simulate_operator_response(message_logs_table, message_id, assigned_operator)
            
        return {
            'statusCode': 200,
            'body': json.dumps('Messages processed successfully')
        }
        
    except Exception as e:
        print(f"Error processing messages: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Failed to process messages'})
        }

def simulate_operator_response(table, message_id, operator):
    """
    Simulate an operator response for demo purposes
    In real app, this would be triggered when operator actually responds
    """
    
    sample_responses = [
        "Thank you for reporting this issue. We'll send a technician to check the bike.",
        "We apologize for the inconvenience. A replacement bike has been arranged.",
        "Issue noted. Our maintenance team will address this immediately.",
        "Thanks for the feedback. We're investigating this problem."
    ]
    
    # Simulate delay and response
    operator_response = random.choice(sample_responses)
    
    # Update the message log with operator response
    table.update_item(
        Key={'message_id': message_id},
        UpdateExpression='SET #status = :status, operator_response = :response, responded_at = :response_time',
        ExpressionAttributeNames={
            '#status': 'status'
        },
        ExpressionAttributeValues={
            ':status': 'responded',
            ':response': operator_response,
            ':response_time': datetime.datetime.utcnow().isoformat()
        }
    )
    
    print(f"Operator {operator} responded: {operator_response}")