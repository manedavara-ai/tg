import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const DigioProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isKycCompleted = localStorage.getItem("kycCompleted") === "true";

  if (!isKycCompleted) {
   
    return <Navigate to="/" replace />;
  }

  return children;
};

export default DigioProtectedRoute; 