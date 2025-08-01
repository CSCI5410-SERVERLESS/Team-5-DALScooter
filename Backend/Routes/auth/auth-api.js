const AWS = require('aws-sdk');
const crypto = require('crypto');
const axios = require('axios');
const { buildResponse, buildHtmlResponse } = require('./utils/response');

const dynamoClient = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

// Environment variables
const SESSIONS_TABLE = process.env.SESSIONS_TABLE || 'AuthSessions';
const QNA_TABLE = process.env.QNA_TABLE || 'UserSecurityQuestions';
const USERS_TABLE = process.env.USERS_TABLE || 'users';
const NOTIFICATION_QUEUE_URL = process.env.NOTIFICATION_QUEUE_URL;

const WORD_BANK = [
    'apple', 'bread', 'chair', 'drink', 'eagle',
    'flame', 'grape', 'house', 'ideal', 'jolly',
    'knife', 'lemon', 'mango', 'noble', 'ocean',
    'plant', 'queen', 'river', 'stone', 'train',
    'unity', 'vivid', 'wheat', 'xenon', 'yield', 'zebra'
];

exports.handler = async (event) => {
    try {
        const path = event.path || event.rawPath;
        const httpMethod = event.httpMethod || event.requestContext?.http?.method;

        if (!path || !httpMethod) {
            throw new Error('Missing path or HTTP method in request event');
        }

        // Route the request based on path and method
        switch (true) {
            case path.endsWith('/callback') && httpMethod === 'GET':
                return await handleCallback(event);

            case path.endsWith('/qna') && httpMethod === 'POST':
                return await handleQna(event);

            case path.endsWith('/cipher') && httpMethod === 'POST':
                return await handleCipher(event);

            case path.endsWith('/status') && httpMethod === 'GET':
                return await handleStatus(event);

            default:
                return buildResponse(404, { error: 'Endpoint not found' })
        }
    } catch (error) {
        console.error('Error:', error);

        return buildResponse(
            error.statusCode || 500,
            {
                error: error.message || 'Internal server error',
                ...(error.details && { details: error.details })
            },
        );
    }
};

// =====================
// Route Handlers
// =====================

async function handleCallback(event) {
    const { code } = event.queryStringParameters || {};
    console.log(event.queryStringParameters)
    if (!code) {
        return buildResponse(400, {
            message: 'Missing code or state parameters',
            details: { required: ['code', 'state'] },
        });
    }

    // Exchange code for Cognito tokens
    const cognitoTokens = await exchangeCodeForTokens(code);
    const userInfo = await getUserInfoFromToken(cognitoTokens.access_token);

    // Check if this is a new user registration or existing user login
    const isNewUser = await checkIfNewUser(userInfo.sub);
    
    if (isNewUser) {
        // Store basic user information for new users
        await storeUserInfo(userInfo);
    }

    // Generate temporary session token
    const tempToken = generateTempToken();
    const sessionData = {
        tempToken,
        userId: userInfo.sub,
        email: userInfo.email,
        firstName: userInfo.given_name || extractFirstNameFromEmail(userInfo.email),
        cognitoTokens: cognitoTokens,
        step1Complete: true,
        step2Complete: false,
        step3Complete: false,
        isNewUser: isNewUser,
        createdAt: Date.now(),
        expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    };

    // Store in DynamoDB
    await dynamoClient.put({
        TableName: SESSIONS_TABLE,
        Item: sessionData
    }).promise();

    const response = {
        tempToken: tempToken,
        nextStep: "qna",
        message: "Step 1 complete. Please proceed to Q&A verification.",
        isNewUser: isNewUser
    };

    const htmlForm = `
<!DOCTYPE html>
<html>
<head>
    <title>Processing Authentication...</title>
    <style>
        body { font-family: system-ui; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { text-align: center; padding: 2rem; background: rgba(255,255,255,0.1); border-radius: 20px; backdrop-filter: blur(10px); }
        .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .welcome { margin-bottom: 1rem; }
        .new-user { color: #90EE90; }
        .returning-user { color: #FFD700; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <div class="welcome ${response.isNewUser ? 'new-user' : 'returning-user'}">
            ${response.isNewUser ? '🎉 Welcome to DALScooter!' : '👋 Welcome back!'}
        </div>
        <h2>Processing Authentication...</h2>
        <p>Setting up your ${response.isNewUser ? 'new account' : 'secure login'}...</p>
    </div>
    
    <form id="authForm" data-auth="true" style="display: none;">
        <input type="hidden" name="tempToken" value="${response.tempToken}">
        <input type="hidden" name="nextStep" value="${response.nextStep}">
        <input type="hidden" name="message" value="${response.message}">
        <input type="hidden" name="isNewUser" value="${response.isNewUser}">
    </form>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('authForm');
            const formData = new FormData(form);
            const authData = {
                tempToken: formData.get('tempToken'),
                nextStep: formData.get('nextStep'),
                message: formData.get('message'),
                isNewUser: formData.get('isNewUser') === 'true'
            };
            
            // Base64 encode the data for secure URL transport
            const dataString = btoa(JSON.stringify(authData));
            
            // Redirect to React app after a short delay
            setTimeout(() => {
                window.location.href = \`http://localhost:5173/auth/qna/callback?data=\${dataString}\`;
            }, 2000);
        });
    </script>
</body>
</html>`;

    return buildHtmlResponse(htmlForm);
}

async function handleQna(event) {
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return buildResponse(200, { message: 'Success' });
    }

    if (!event.body) {
        return buildResponse(400, { message: 'Missing request body' });
    }

    const { tempToken, answers } = JSON.parse(event.body);

    if (!tempToken || !answers) {
        return buildResponse(400, { 
            message: 'Missing tempToken or answers', 
            details: { required: ['tempToken', 'answers'] },
        });
    }

    // Retrieve session
    const session = await getSession(tempToken);
    if (!session || !session.step1Complete) {
        return buildResponse(401, { message: 'Invalid session or step 1 not complete' });
    }

    // Check if user has existing Q&A answers
    const existingAnswers = await getUserQnaAnswers(session.userId);

    // Generate cipher challenge for both first-time and returning users
    const randomWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    const randomShift = Math.floor(Math.random() * 25) + 1; // shift between 1 and 25
    const cipherChallenge = caesarShift(randomWord, randomShift);

    if (!existingAnswers) {
        // First time signup - store the Q&A answers
        try {
            await storeQnaAnswers(session.userId, answers);

            // Update session to mark step 2 as complete AND store cipher challenge
            await dynamoClient.update({
                TableName: SESSIONS_TABLE,
                Key: { tempToken },
                UpdateExpression: 'SET step2Complete = :true, cipherOriginal = :word, cipherShift = :shift, cipherChallenge = :challenge',
                ExpressionAttributeValues: {
                    ':true': true,
                    ':word': randomWord,
                    ':shift': randomShift,
                    ':challenge': cipherChallenge
                }
            }).promise();

            return buildResponse(200, {
                tempToken,
                nextStep: 'cipher',
                cipherChallenge,
                cipherShift: randomShift,
                message: 'Q&A answers stored successfully. Step 2 complete. Please solve the cipher challenge.',
                isFirstTimeSetup: true
            });
        } catch (error) {
            return buildResponse(error.statusCode || 500, {
                error: error.message || 'Internal server error',
                ...(error.details && { details: error.details }),
            });
        }
    } else {
        // Existing user - verify Q&A answers
        const isQnaValid = await verifyQnaAnswers(session.userId, answers);
        if (!isQnaValid) {
            return buildResponse(403, {
                error: 'Q&A verification failed',
                message: 'One or more security question answers are incorrect'
            });
        }

        // Store cipher challenge and answer shift in DynamoDB (or update session)
        await dynamoClient.update({
            TableName: SESSIONS_TABLE,
            Key: { tempToken },
            UpdateExpression: 'SET step2Complete = :true, cipherOriginal = :word, cipherShift = :shift, cipherChallenge = :challenge',
            ExpressionAttributeValues: {
                ':true': true,
                ':word': randomWord,
                ':shift': randomShift,
                ':challenge': cipherChallenge
            }
        }).promise();

        // Return the challenge with the response
        return buildResponse(200, {
            tempToken,
            nextStep: 'cipher',
            cipherChallenge,
            cipherShift: randomShift,
            message: 'Step 2 complete. Please solve the cipher challenge.',
            isFirstTimeSetup: false
        });
    }
}

async function handleCipher(event) {
    if (!event.body) {
        return buildResponse(400, { message: 'Missing request body' });
    }

    const { tempToken, cipherResponse } = JSON.parse(event.body);

    if (!tempToken || !cipherResponse) {
        return buildResponse(400, {
            message: 'Missing tempToken or cipherResponse',
            details: { required: ['tempToken', 'cipherResponse'] },
        });
    }

    // Retrieve session
    const session = await getSession(tempToken);
    if (!session || !session.step1Complete || !session.step2Complete) {
        return buildResponse(401, { message: 'Invalid session or previous steps not complete' });
    }

    // Verify cipher by passing original word and shift stored in session
    const cipherData = {
        cipherOriginal: session.cipherOriginal,
        cipherShift: session.cipherShift
    };

    const isCipherValid = verifyCipherLogic(cipherResponse, cipherData);
    if (!isCipherValid) {
        return buildResponse(403, { message: 'Cipher verification failed' });
    }

    // All steps complete - determine notification type and send appropriate notification
    try {
        if (session.isNewUser) {
            // Send registration success notification
            await sendNotification('REGISTRATION_SUCCESS', {
                email: session.email,
                userType: determineUserType(session.email), // Based on email domain or other logic
                firstName: session.firstName
            });
            console.log('Registration success notification sent for new user:', session.userId);
        } else {
            // Send login success notification
            await sendNotification('LOGIN_SUCCESS', {
                email: session.email,
                firstName: session.firstName,
                loginTime: new Date().toISOString(),
                ipAddress: getClientIpAddress(event)
            });
            console.log('Login success notification sent for returning user:', session.userId);
        }
    } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the authentication process if notification fails
    }

    // Delete session and return tokens
    await dynamoClient.delete({
        TableName: SESSIONS_TABLE,
        Key: { tempToken }
    }).promise();

    return buildResponse(
        200, 
        {
            accessToken: session.cognitoTokens.access_token,
            idToken: session.cognitoTokens.id_token,
            refreshToken: session.cognitoTokens.refresh_token,
            message: session.isNewUser ? 
                'Registration and authentication complete! Welcome to DALScooter!' : 
                'Authentication complete! Welcome back!',
            isNewUser: session.isNewUser
        },
    );
}

async function handleStatus(event) {
    const { tempToken } = event.queryStringParameters || {};

    if (!tempToken) {
        return buildResponse(400, {
            message: 'Missing tempToken parameter',
            details: { required: ['tempToken'] },
        });
    }

    const session = await getSession(tempToken);
    if (!session) {
        return buildResponse(404, { message: 'Session not found' });
    }

    return buildResponse(
        200, 
        {
            step1Complete: session.step1Complete,
            step2Complete: session.step2Complete,
            step3Complete: session.step3Complete,
            currentStep: getCurrentStep(session),
            isNewUser: session.isNewUser || false
        }
    );
}

// =====================
// Helper Functions
// =====================

// Notification helper function
async function sendNotification(type, data) {
    if (!NOTIFICATION_QUEUE_URL) {
        console.warn('NOTIFICATION_QUEUE_URL not configured, skipping notification');
        return;
    }
    
    try {
        const message = {
            type: type,
            ...data,
            timestamp: new Date().toISOString()
        };
        
        const params = {
            QueueUrl: NOTIFICATION_QUEUE_URL,
            MessageBody: JSON.stringify(message),
            MessageAttributes: {
                'messageType': {
                    DataType: 'String',
                    StringValue: type
                }
            }
        };
        
        const result = await sqs.sendMessage(params).promise();
        console.log(`Notification queued: ${type}, MessageId: ${result.MessageId}`);
        return result;
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error; // Re-throw to allow caller to handle
    }
}

// Check if user is new (first time registration)
async function checkIfNewUser(userId) {
    try {
        const result = await dynamoClient.get({
            TableName: USERS_TABLE,
            Key: { userId }
        }).promise();
        
        return !result.Item; // Return true if user doesn't exist (new user)
    } catch (error) {
        console.error('Error checking if user is new:', error);
        return true; // Assume new user if error occurs
    }
}

// Store user information for new users
async function storeUserInfo(userInfo) {
    try {
        const userData = {
            userId: userInfo.sub,
            email: userInfo.email,
            firstName: userInfo.given_name || extractFirstNameFromEmail(userInfo.email),
            lastName: userInfo.family_name || '',
            registrationDate: new Date().toISOString(),
            cognitoGroups: userInfo['cognito:groups'] || [],
            lastLoginAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await dynamoClient.put({
            TableName: USERS_TABLE,
            Item: userData,
            ConditionExpression: 'attribute_not_exists(userId)' // Only create if doesn't exist
        }).promise();
        
        console.log('New user stored:', userData.userId);
    } catch (error) {
        if (error.code !== 'ConditionalCheckFailedException') {
            console.error('Error storing user info:', error);
            throw error;
        }
        // User already exists, ignore conditional check failure
    }
}

// Determine user type based on email or other logic
function determineUserType(email) {
    // You can customize this logic based on your requirements
    if (email.includes('@dal.ca') || email.includes('@dalhousie.ca')) {
        return 'student';
    } else if (email.includes('admin') || email.includes('franchise')) {
        return 'franchise';
    } else {
        return 'customer';
    }
}

// Extract first name from email if not provided
function extractFirstNameFromEmail(email) {
    if (!email) return 'User';
    
    const localPart = email.split('@')[0];
    // Remove numbers and special characters, capitalize first letter
    const cleaned = localPart.replace(/[^a-zA-Z]/g, '');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase() || 'User';
}

// Get client IP address from event
function getClientIpAddress(event) {
    // Try to get IP from various possible locations in the event
    if (event.requestContext?.identity?.sourceIp) {
        return event.requestContext.identity.sourceIp;
    }
    if (event.headers?.['X-Forwarded-For']) {
        return event.headers['X-Forwarded-For'].split(',')[0].trim();
    }
    if (event.headers?.['X-Real-IP']) {
        return event.headers['X-Real-IP'];
    }
    return 'Unknown';
}

// Caesar cipher encode function
function caesarShift(word, shift) {
    return word.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 97 && code <= 122) { // a-z
            return String.fromCharCode(((code - 97 + shift) % 26) + 97);
        }
        return char;
    }).join('');
}

// Caesar cipher decode function
function caesarUnshift(word, shift) {
    return caesarShift(word, (26 - shift) % 26);
}

function verifyCipherLogic(userResponse, cipherData) {
    const { cipherOriginal, cipherShift } = cipherData;

    // The user should have decoded the challenge and provided the original word
    // So we just need to compare their response directly with the original
    const normalizedUserResponse = userResponse.toLowerCase().trim();
    const normalizedOriginal = cipherOriginal.toLowerCase().trim();

    return normalizedUserResponse === normalizedOriginal;
}

function generateTempToken() {
    return crypto.randomBytes(32).toString('hex');
}

async function getSession(tempToken) {
    const result = await dynamoClient.get({
        TableName: SESSIONS_TABLE,
        Key: { tempToken }
    }).promise();

    if (!result.Item) return null;

    // Check expiration
    if (Date.now() > result.Item.expiresAt) {
        await dynamoClient.delete({
            TableName: SESSIONS_TABLE,
            Key: { tempToken }
        }).promise();
        return null;
    }

    return result.Item;
}

async function exchangeCodeForTokens(code) {
    const tokenEndpoint = `https://${process.env.COGNITO_DOMAIN}/oauth2/token`;

    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.COGNITO_CLIENT_ID,
        client_secret: process.env.COGNITO_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.REDIRECT_URI
    });

    try {
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const tokens = await response.json();
        return tokens;
    } catch (error) {
        console.error('Token exchange failed:', error);
        throw error;
    }
}

async function getUserInfoFromToken(accessToken) {
    console.log("Getting user info from token");
    const userInfoEndpoint = `https://${process.env.COGNITO_DOMAIN}/oauth2/userInfo`;
    const response = await axios.get(userInfoEndpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return response.data;
}

async function verifyQnaAnswers(userId, answers) {
    const userQna = await dynamoClient.get({
        TableName: QNA_TABLE,
        Key: { userId }
    }).promise();

    if (!userQna.Item) {
        return false;
    }

    return answers.every((answer, index) =>
        hashAnswer(answer) === userQna.Item.hashedAnswers[index]
    );
}

function hashAnswer(answer) {
    return crypto.createHash('sha256').update(answer.toLowerCase().trim()).digest('hex');
}

function getCurrentStep(session) {
    if (!session.step1Complete) return 1;
    if (!session.step2Complete) return 2;
    if (!session.step3Complete) return 3;
    return 'complete';
}

async function getUserQnaAnswers(userId) {
    const result = await dynamoClient.get({
        TableName: QNA_TABLE,
        Key: { userId }
    }).promise();

    return result.Item;
}

async function storeQnaAnswers(userId, answers) {
    const answersArray = Array.isArray(answers)
        ? answers
        : Object.values(answers); // fallback if answers is an object

    const hashedAnswers = answersArray.map(ans => hashAnswer(ans));

    await dynamoClient.put({
        TableName: QNA_TABLE,
        Item: {
            userId,
            hashedAnswers,
            createdAt: new Date().toISOString()
        }
    }).promise();
}