/**
 * Role-Based Access Control Middleware
 * This middleware checks if the user has the required role to access a resource
 */

// Role-based access middleware
const checkRole = (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized to access this route'
        });
      }
  
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: `User role ${req.user.role} is not authorized to access this route`
        });
      }
      
      next();
    };
  };
  
  module.exports = {
    checkRole
  };