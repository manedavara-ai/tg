import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import cashfreeLogo from "../assets/paylogo.webp";

const PaymentPage = () => {
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const userData = localStorage.getItem("user");
  
  let user = {};
  try {
    user = userData ? JSON.parse(userData) : {};
  } catch (error) {
  }
  
  const customer_id = user?._id || user?.id || "guest_user";
  const phone = user?.phone || localStorage.getItem("userPhone") || "9999999999";

  const productName = location.state?.productName || "Unknown Product";
  const productPrice = location.state?.productPrice || 0;
  const planData = location.state?.planData || {};
  const purchaseDateTime = location.state?.purchaseDateTime || new Date().toISOString();
  console.log(customer_id, phone, productName, productPrice, planData);
  
  useEffect(() => {
    if (!location.state || !productPrice) {
      console.warn("No product data found, redirecting to home");
      toast.error("No product data found, redirecting to home");
      navigate("/");
    }

    const checkPaymentStatus = async () => {
      const orderId = localStorage.getItem('currentOrderId');
      if (orderId) {
        try {
          const response = await axios.get(`http://localhost:4000/api/payment/status/${orderId}`);
          if (response.data.status === 'SUCCESS') {
            toast.success(`Payment successful! Transaction ID: ${response.data.transactionId}`);
            localStorage.setItem('transactionId', response.data.transactionId);
            localStorage.setItem('paymentCompleted', 'true'); // <-- Ensure Step 2 is completed
            localStorage.removeItem('currentOrderId');
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
        }
      }
    };

    checkPaymentStatus();
  }, [location.state, productPrice, navigate]);

  const calculateExpiryDate = (duration) => {
    const now = new Date();
    let expiryDate = new Date(now);

    if (typeof duration === 'string') {
      if (duration.toLowerCase().includes('month')) {
        expiryDate.setMonth(now.getMonth() + 1);
      } else if (duration.toLowerCase().includes('year')) {
        expiryDate.setFullYear(now.getFullYear() + 1);
      } else if (duration.toLowerCase().includes('day')) {
        const days = parseInt(duration);
        expiryDate.setDate(now.getDate() + (isNaN(days) ? 30 : days));
      } else {
        expiryDate.setDate(now.getDate() + 30);
      }
    } else if (typeof duration === 'number') {
      expiryDate.setDate(now.getDate() + duration);
    } else {
      expiryDate.setDate(now.getDate() + 30);
    }

    return expiryDate.toISOString();
  };

  const convertDurationToDays = (duration) => {
    if (typeof duration === 'string') {
      if (duration.toLowerCase().includes('month')) {
        return 30;
      } else if (duration.toLowerCase().includes('year')) {
        return 365;
      } else if (duration.toLowerCase().includes('day')) {
        const days = parseInt(duration);
        return isNaN(days) ? 30 : days;
      }
    }
    return typeof duration === 'number' ? duration : 30;
  };

  const handlePayment = async () => {
    if (!productPrice || productPrice <= 0) {
      toast.error("Invalid product price. Please try again.");
      return;
    }

    if (!customer_id) {
      toast.error("Customer ID is missing. Please try logging in again.");
      return;
    }

    if (!phone) {
      toast.error("Phone number is missing. Please try logging in again.");
      return;
    }

    if (!planData.duration) {
      toast.error("Invalid subscription duration. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const durationInDays = convertDurationToDays(planData.duration);
      const expiryDate = calculateExpiryDate(planData.duration);
      
      const requestData = {
        customer_id,
        userid: customer_id,
        phone,
        amount: productPrice,
        plan_id: id,
        plan_name: productName,
        purchase_datetime: purchaseDateTime,
        expiry_date: expiryDate,
        duration: durationInDays
      };

      console.log('Sending payment request:', requestData);
      
      const response = await axios.post("http://localhost:4000/api/payment/create-payment-link", requestData);

      console.log('Payment response:', response.data);

      const { paymentLink, orderId } = response.data;
      if (!paymentLink) throw new Error("Payment link not received");

      if (orderId) {
        localStorage.setItem('currentOrderId', orderId);
      }

      localStorage.setItem('paymentDetails', JSON.stringify({
        orderId,
        amount: productPrice,
        planName: productName,
        customerId: customer_id,
        phone: phone,
        expiryDate: expiryDate,
        duration: durationInDays,
        originalDuration: planData.duration
      }));
      localStorage.setItem('paymentCompleted', 'true'); // <-- Ensure Step 2 is completed

      window.location.href = paymentLink;
    } catch (error) {
      console.error("Payment Error Details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });

      let errorMessage = "Payment failed. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid request data. Please check your information.";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please check your internet connection.";
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
        : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
    } flex items-center justify-center px-4 py-4`}>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
      <div className={`${
        isDarkMode 
          ? "bg-gray-800 border-gray-700" 
          : "bg-white border-gray-200"
      } rounded-xl shadow-xl w-[350px] p-4 flex flex-col items-center gap-3 border transition-colors duration-300 relative`}>
        <button
          onClick={toggleTheme}
          className={`absolute top-2 right-2 p-1.5 rounded-full ${
            isDarkMode 
              ? "bg-gray-700 text-yellow-300 hover:bg-gray-600" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } transition-colors duration-300`}
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <div className={`flex items-center gap-1.5 ${
          isDarkMode ? "text-green-400" : "text-green-600"
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs font-semibold">Secure Payment Gateway</span>
        </div>

        <img
          src={cashfreeLogo}
          alt="Cashfree Logo"
          className={`h-10 w-auto filter ${isDarkMode ? "brightness-150" : ""}`}
        />

        <h1 className={`text-xl font-bold tracking-wide text-center ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}>
          Secure Payment Portal
        </h1>

        <div className={`w-full text-center space-y-2 ${
          isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
        } p-3 rounded-lg transition-colors duration-300`}>
          <p className={`text-sm font-medium ${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          }`}>
            Transaction Details
          </p>
          <div className="space-y-1">
            <p className={`text-base font-semibold break-words ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              {productName}
            </p>
            <p className={`text-2xl font-bold ${
              isDarkMode ? "text-green-400" : "text-green-600"
            }`}>
              ₹{productPrice.toLocaleString()}
            </p>
            {planData.duration && (
              <p className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Duration: {planData.duration} days
              </p>
            )}
            {planData.duration && (
              <p className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Expires: {new Date(calculateExpiryDate(planData.duration)).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className={`w-full grid grid-cols-2 gap-2 text-xs ${
          isDarkMode ? "text-gray-400" : "text-gray-600"
        }`}>
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>256-bit SSL</span>
          </div>
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Secure Checkout</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading || !productPrice}
          className={`w-full py-2.5 rounded-lg text-white font-bold transition-all duration-300 ${
            loading || !productPrice
              ? isDarkMode ? "bg-gray-600" : "bg-gray-400"
              : isDarkMode 
                ? "bg-green-600 hover:bg-green-700 hover:shadow-green-500/20" 
                : "bg-green-500 hover:bg-green-600 hover:shadow-green-400/20"
          } shadow-lg active:scale-95`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-1.5">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            "Proceed to Secure Payment"
          )}
        </button>

        <p className={`text-[10px] text-center ${
          isDarkMode ? "text-gray-500" : "text-gray-600"
        }`}>
          Your payment information is encrypted and secure
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;