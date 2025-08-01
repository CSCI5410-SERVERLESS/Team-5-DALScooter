function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
}

function buildHtmlResponse(htmlContent, statusCode = 200) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'text/html',
        },
        body: htmlContent
    };
}

module.exports = {
    buildResponse,
    buildHtmlResponse
};