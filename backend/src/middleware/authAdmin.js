const jwt = require('jsonwebtoken');

function authAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if (
        !authHeader || !authHeader.startsWith('Bearer ')
    ) {
        return res.status(401).json({
            error: 'Admin authentication required'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(
            token, process.env.ACCESS_SECRET_TOKEN);

        if (decoded.role !== 'admin') {
            return res.status(403).json({
                error: 'Admin access required'
            });
        }

        req.admin = decoded;
        next();

    } catch (error) {
        console.error('JWT verification failed:', error.message);
        return res.status(401).json({
            error: 'Invalid or expired access token'
        });
    }
}

module.exports = authAdmin;