import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ ok: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ ok: false, message: 'Invalid token' });
    }
}

function checkRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ ok: false, message: 'Authentication required' });
        }
        
        if (!allowedRoles.includes(req.user.userType)) {
            return res.status(403).json({ ok: false, message: 'Insufficient permissions' });
        }
        
        next();
    };
}

export default authMiddleware;
export { checkRole };