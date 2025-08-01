const AWS = require('aws-sdk');
const { buildResponse } = require('./utils/response');

const sns = new AWS.SNS();
const sqs = new AWS.SQS();
const dynamoClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        console.log('Event received:', JSON.stringify(event, null, 2));
        
        // Handle different event sources
        if (event.Records) {
            // SQS message processing
            return await processSQSMessages(event.Records);
        } else if (event.httpMethod) {
            // Direct HTTP API calls
            return await handleHttpRequest(event);
        } else {
            // Direct Lambda invocation
            return await handleDirectInvocation(event);
        }
    } catch (error) {
        console.error('Error processing notification:', error);
        return buildResponse(500, {
            error: 'Failed to process notification',
            details: error.message
        });
    }
};

// =====================
// SQS Message Processing
// =====================

async function processSQSMessages(records) {
    const results = [];
    
    for (const record of records) {
        try {
            const messageBody = JSON.parse(record.body);
            console.log('Processing SQS message:', messageBody);
            
            let result;
            switch (messageBody.type) {
                case 'REGISTRATION_SUCCESS':
                    result = await sendRegistrationSuccessNotification(messageBody);
                    break;
                case 'LOGIN_SUCCESS':
                    result = await sendLoginSuccessNotification(messageBody);
                    break;
                case 'BOOKING_CONFIRMATION':
                    result = await sendBookingConfirmationNotification(messageBody);
                    break;
                case 'BOOKING_FAILURE':
                    result = await sendBookingFailureNotification(messageBody);
                    break;
                case 'EBIKE_BOOKING_REQUEST':
                    result = await processEbikeBookingRequest(messageBody);
                    break;
                default:
                    console.warn('Unknown message type:', messageBody.type);
                    result = { status: 'ignored', message: 'Unknown message type' };
            }
            
            results.push(result);
        } catch (error) {
            console.error('Error processing SQS record:', error);
            results.push({ status: 'error', error: error.message });
        }
    }
    
    return { processedMessages: results.length, results };
}

// =====================
// HTTP Request Handling
// =====================

async function handleHttpRequest(event) {
    const path = event.path || event.rawPath;
    const httpMethod = event.httpMethod || event.requestContext?.http?.method;
    
    if (httpMethod === 'OPTIONS') {
        return buildResponse(200, { message: 'Success' });
    }
    
    if (!event.body) {
        return buildResponse(400, { error: 'Missing request body' });
    }
    
    const requestBody = JSON.parse(event.body);
    
    switch (path) {
        case '/notifications/send':
            return await handleSendNotification(requestBody);
        case '/notifications/queue':
            return await handleQueueMessage(requestBody);
        default:
            return buildResponse(404, { error: 'Endpoint not found' });
    }
}

// =====================
// Direct Lambda Invocation
// =====================

async function handleDirectInvocation(event) {
    switch (event.action) {
        case 'SEND_NOTIFICATION':
            return await sendDirectNotification(event);
        case 'QUEUE_MESSAGE':
            return await queueMessage(event);
        default:
            throw new Error('Unknown action: ' + event.action);
    }
}

// =====================
// Notification Functions
// =====================

async function sendRegistrationSuccessNotification(messageData) {
    const { email, userType, firstName } = messageData;
    
    const subject = 'Welcome to DALScooter - Registration Successful!';
    const message = `
Hello ${firstName || 'User'},

Congratulations! Your DALScooter ${userType} account has been successfully created.

You can now:
${userType === 'customer' ? `
- Browse and reserve e-bikes, gyroscooters, and segways
- Use our virtual assistant for navigation help
- Provide feedback on your rides
` : `
- Manage your bike fleet
- Update bike features and pricing
- View customer analytics and feedback
- Communicate with customers
`}

Thank you for choosing DALScooter!

Best regards,
The DALScooter Team
    `.trim();
    
    const result = await publishToSNS(subject, message, email);
    
    // Log notification in DynamoDB
    await logNotification({
        type: 'REGISTRATION_SUCCESS',
        recipient: email,
        subject,
        timestamp: new Date().toISOString(),
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId
    });
    
    return result;
}

async function sendLoginSuccessNotification(messageData) {
    const { email, firstName, loginTime, ipAddress } = messageData;
    
    const subject = 'DALScooter - Successful Login';
    const message = `
Hello ${firstName || 'User'},

You have successfully logged into your DALScooter account.

Login Details:
- Time: ${new Date(loginTime).toLocaleString()}
- IP Address: ${ipAddress || 'Unknown'}

If this wasn't you, please contact our support team immediately.

Best regards,
The DALScooter Team
    `.trim();
    
    const result = await publishToSNS(subject, message, email);
    
    await logNotification({
        type: 'LOGIN_SUCCESS',
        recipient: email,
        subject,
        timestamp: new Date().toISOString(),
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId
    });
    
    return result;
}

async function sendBookingConfirmationNotification(messageData) {
    const { email, firstName, bookingDetails } = messageData;
    const { bookingId, bikeType, startTime, endTime, accessCode, location } = bookingDetails;
    
    const subject = `DALScooter - Booking Confirmed #${bookingId}`;
    const message = `
Hello ${firstName || 'User'},

Your DALScooter booking has been confirmed!

Booking Details:
- Booking ID: ${bookingId}
- Bike Type: ${bikeType}
- Start Time: ${new Date(startTime).toLocaleString()}
- End Time: ${new Date(endTime).toLocaleString()}
- Access Code: ${accessCode}
- Location: ${location || 'TBD'}

Please arrive at the designated location at your scheduled time. Use the access code to unlock your ${bikeType}.

Have a great ride!

Best regards,
The DALScooter Team
    `.trim();
    
    const result = await publishToSNS(subject, message, email);
    
    await logNotification({
        type: 'BOOKING_CONFIRMATION',
        recipient: email,
        subject,
        bookingId,
        timestamp: new Date().toISOString(),
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId
    });
    
    return result;
}

async function sendBookingFailureNotification(messageData) {
    const { email, firstName, failureDetails } = messageData;
    const { bikeType, requestedTime, reason } = failureDetails;
    
    const subject = 'DALScooter - Booking Request Failed';
    const message = `
Hello ${firstName || 'User'},

Unfortunately, your DALScooter booking request could not be processed.

Request Details:
- Bike Type: ${bikeType}
- Requested Time: ${new Date(requestedTime).toLocaleString()}
- Reason: ${reason}

Please try booking a different time slot or contact our support team for assistance.

Best regards,
The DALScooter Team
    `.trim();
    
    const result = await publishToSNS(subject, message, email);
    
    await logNotification({
        type: 'BOOKING_FAILURE',
        recipient: email,
        subject,
        timestamp: new Date().toISOString(),
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        failureReason: reason
    });
    
    return result;
}

async function processEbikeBookingRequest(messageData) {
    const { userId, bikeType, startTime, endTime, preferences } = messageData;
    
    // Business logic for booking approval
    const bookingResult = await processBookingLogic(messageData);
    
    if (bookingResult.approved) {
        // Send booking confirmation
        const confirmationMessage = {
            type: 'BOOKING_CONFIRMATION',
            email: bookingResult.userEmail,
            firstName: bookingResult.firstName,
            bookingDetails: {
                bookingId: bookingResult.bookingId,
                bikeType,
                startTime,
                endTime,
                accessCode: bookingResult.accessCode,
                location: bookingResult.location
            }
        };
        
        // Queue confirmation notification
        await sendToSQS(confirmationMessage, process.env.NOTIFICATION_QUEUE_URL);
        
        return { status: 'approved', bookingId: bookingResult.bookingId };
    } else {
        // Send booking failure notification
        const failureMessage = {
            type: 'BOOKING_FAILURE',
            email: bookingResult.userEmail,
            firstName: bookingResult.firstName,
            failureDetails: {
                bikeType,
                requestedTime: startTime,
                reason: bookingResult.failureReason
            }
        };
        
        await sendToSQS(failureMessage, process.env.NOTIFICATION_QUEUE_URL);
        
        return { status: 'rejected', reason: bookingResult.failureReason };
    }
}

// =====================
// Helper Functions
// =====================

async function publishToSNS(subject, message, email) {
    try {
        const params = {
            Subject: subject,
            Message: message,
            TopicArn: process.env.EMAIL_TOPIC_ARN
        };
        
        // If email is provided, add message attributes for email filtering
        if (email) {
            params.MessageAttributes = {
                email: {
                    DataType: 'String',
                    StringValue: email
                }
            };
        }
        
        const result = await sns.publish(params).promise();
        
        return {
            success: true,
            messageId: result.MessageId
        };
    } catch (error) {
        console.error('SNS publish error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function sendToSQS(message, queueUrl) {
    try {
        const params = {
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(message),
            MessageAttributes: {
                'messageType': {
                    DataType: 'String',
                    StringValue: message.type
                }
            }
        };
        
        const result = await sqs.sendMessage(params).promise();
        return {
            success: true,
            messageId: result.MessageId
        };
    } catch (error) {
        console.error('SQS send error:', error);
        throw error;
    }
}

async function logNotification(notificationData) {
    try {
        await dynamoClient.put({
            TableName: process.env.NOTIFICATIONS_LOG_TABLE || 'NotificationsLog',
            Item: {
                notificationId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                ...notificationData,
                ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
            }
        }).promise();
    } catch (error) {
        console.error('Failed to log notification:', error);
        // Don't throw - logging failure shouldn't break notification sending
    }
}

async function processBookingLogic(bookingData) {
    // Simplified booking logic - you would implement your actual business rules here
    const { userId, bikeType, startTime, endTime } = bookingData;
    
    try {
        // Get user details
        const userResult = await dynamoClient.get({
            TableName: process.env.USERS_TABLE || 'Users',
            Key: { userId }
        }).promise();
        
        if (!userResult.Item) {
            return {
                approved: false,
                failureReason: 'User not found',
                userEmail: null
            };
        }
        
        const user = userResult.Item;
        
        // Check bike availability (simplified)
        const isAvailable = await checkBikeAvailability(bikeType, startTime, endTime);
        
        if (!isAvailable) {
            return {
                approved: false,
                failureReason: 'No bikes available for the requested time slot',
                userEmail: user.email,
                firstName: user.firstName
            };
        }
        
        // Generate booking
        const bookingId = `BK${Date.now()}`;
        const accessCode = Math.random().toString(36).substr(2, 8).toUpperCase();
        
        // Store booking (you would implement this)
        await storeBooking({
            bookingId,
            userId,
            bikeType,
            startTime,
            endTime,
            accessCode,
            status: 'confirmed'
        });
        
        return {
            approved: true,
            bookingId,
            accessCode,
            location: 'Main Campus Bike Station',
            userEmail: user.email,
            firstName: user.firstName
        };
        
    } catch (error) {
        console.error('Booking logic error:', error);
        return {
            approved: false,
            failureReason: 'System error - please try again later',
            userEmail: bookingData.email || null
        };
    }
}

async function checkBikeAvailability(bikeType, startTime, endTime) {
    // Simplified availability check - implement your actual logic
    // This would query your bikes/bookings database
    return Math.random() > 0.3; // 70% chance of availability for demo
}

async function storeBooking(bookingData) {
    await dynamoClient.put({
        TableName: process.env.BOOKINGS_TABLE || 'Bookings',
        Item: {
            ...bookingData,
            createdAt: new Date().toISOString()
        }
    }).promise();
}

// =====================
// HTTP Handler Functions
// =====================

async function handleSendNotification(requestBody) {
    const { type, data } = requestBody;
    
    let result;
    switch (type) {
        case 'REGISTRATION_SUCCESS':
            result = await sendRegistrationSuccessNotification(data);
            break;
        case 'LOGIN_SUCCESS':
            result = await sendLoginSuccessNotification(data);
            break;
        case 'BOOKING_CONFIRMATION':
            result = await sendBookingConfirmationNotification(data);
            break;
        case 'BOOKING_FAILURE':
            result = await sendBookingFailureNotification(data);
            break;
        default:
            return buildResponse(400, { error: 'Unknown notification type' });
    }
    
    return buildResponse(200, { success: true, result });
}

async function handleQueueMessage(requestBody) {
    const { message, queueUrl } = requestBody;
    
    const result = await sendToSQS(message, queueUrl || process.env.NOTIFICATION_QUEUE_URL);
    
    return buildResponse(200, { success: true, messageId: result.messageId });
}

async function sendDirectNotification(event) {
    return await handleSendNotification(event);
}

async function queueMessage(event) {
    return await handleQueueMessage(event);
}