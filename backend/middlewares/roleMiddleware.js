// module.exports = function requireRole(requiredRole) {
//   return (req, res, next) => {
//     try {
//       const admin = req.admin || req.user; // support either property
//       if (!admin) {
//         return res.status(401).json({ message: 'Not authenticated' });
//       }

//       const role = admin.role;
//       if (!role) {
//         return res.status(403).json({ message: 'Role not found' });
//       }

//       if (requiredRole === 'superadmin' && role !== 'superadmin') {
//         return res.status(403).json({ message: 'Forbidden: Super Admins only' });
//       }

//       next();
//     } catch (error) {
//       return res.status(500).json({ message: 'Role check failed', error: error.message });
//     }
//   };
// };

// middlewares/requireRole.js
module.exports = function requireRole(requiredRole) {
  return (req, res, next) => {
    try {
      const admin = req.admin;
      if (!admin) return res.status(401).json({ message: "Not authenticated" });

      const role = (admin.role || "").toLowerCase();
      if (requiredRole.toLowerCase() === "superadmin" && role !== "superadmin") {
        return res.status(403).json({ message: "Forbidden: Super Admins only" });
      }

      next();
    } catch (err) {
      res.status(500).json({ message: "Role check failed", error: err.message });
    }
  };
};
