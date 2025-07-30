const redirectBaseUri = 'https://eyoib5lnj8.execute-api.us-east-1.amazonaws.com';
const cognitoConfig = {
    clientId: '3itend8hpu9236609nkc8tct4g',
    redirectUri: `${redirectBaseUri}/dev/auth/callback`,
    authUrl: 'https://dalscooter-auth-24347.auth.us-east-1.amazoncognito.com/oauth2/authorize',
    signupUrl: 'https://dalscooter-auth-24347.auth.us-east-1.amazoncognito.com/signup',
    logoutUrl: 'https://dalscooter-auth-24347.auth.us-east-1.amazoncognito.com/logout',
    scope: 'email openid profile'
};

export const API_BASE_URL = `${redirectBaseUri}/dev`;

export const getApiHeaders = (requireAuth = false) => {
    const headers = { 'Content-Type': 'application/json' };
    if (requireAuth) {
        const token = sessionStorage.getItem('jwt');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const feedbackCategories = [
    { value: 'overall', label: 'Overall Experience' },
    { value: 'vehicle_condition', label: 'Vehicle Condition' },
    { value: 'battery_performance', label: 'Battery Performance' },
    { value: 'comfort', label: 'Comfort & Ergonomics' },
    { value: 'safety', label: 'Safety Features' },
    { value: 'booking_process', label: 'Booking Process' },
    { value: 'customer_service', label: 'Customer Service' }
];

export const commonIssues = [
    'Battery died quickly', 'Vehicle was dirty', 'Mechanical problems',
    'Uncomfortable ride', 'Poor GPS tracking', 'Difficulty finding vehicle',
    'Charging issues', 'App problems'
];

export const getBatteryColor = (level) => {
    if (level >= 80) return 'text-green-500';
    if (level >= 60) return 'text-yellow-500';
    if (level >= 40) return 'text-orange-500';
    return 'text-red-500';
};

export const getStatusColor = (status) => {
    const colors = {
        confirmed: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
        active: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getSentimentBadge = (sentiment) => {
    const colors = {
        'POSITIVE': 'bg-green-100 text-green-800 border-green-300',
        'NEGATIVE': 'bg-red-100 text-red-800 border-red-300',
        'NEUTRAL': 'bg-gray-100 text-gray-800 border-gray-300',
        'MIXED': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };
    return colors[sentiment] || 'bg-gray-50 text-gray-600 border-gray-200';
};

export const getSeverityBadge = (severity) => {
    const colors = {
        'HIGH': 'bg-red-100 text-red-700 border-red-300',
        'MEDIUM': 'bg-yellow-100 text-yellow-700 border-yellow-300',
        'LOW': 'bg-green-100 text-green-700 border-green-300',
    };
    return colors[severity] || 'bg-gray-100 text-gray-600 border-gray-200';
};

export { redirectBaseUri, cognitoConfig };