const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.query.apiKey;  // Retrieve the API key from the query string
    const expectedApiKey = process.env.API_KEY;  // Retrieve the expected API key from environment variables

    if (!apiKey || apiKey !== expectedApiKey) {
        return res.status(403).json({ error: 'Forbidden: Invalid or missing API key' });
    }

    next();  // If the API key is valid, continue to the next middleware/handler
};


module.exports = {apiKeyMiddleware}
