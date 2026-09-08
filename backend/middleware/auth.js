const jwt = require("jsonwebtoken");

// ============= AUTHENTICATE =============
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
      });
    }
    console.error("Auth Error:", error);
    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

// ============= AUTHORIZE =============
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};