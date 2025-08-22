import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const KycProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isPaymentCompleted = localStorage.getItem("paymentCompleted") === "true";
  const isKycCompleted = localStorage.getItem("kycCompleted") === "true";

  if (!isPaymentCompleted) {
    return <Navigate to="/" replace />;
  }

  if (isKycCompleted) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default KycProtectedRoute;
