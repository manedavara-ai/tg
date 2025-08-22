import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createUser } from "../../services/action/kycUser";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import axios from "axios";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli",
  "Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export default function KYCForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const kycNavigation = useSelector((state) => state.kycReducer.kycNavigation);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    city: "",
    state: "",
    phone: "",
    panNumber: "",
    dob: "",
  });

  const [errors, setErrors] = useState({});

  const getUserId = () => {
    const userData = localStorage.getItem("user");
    try {
      const user = JSON.parse(userData);
      return user?._id || user?.id;
    } catch (error) {
      return null;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (formData.middleName && formData.middleName.length < 2) {
      newErrors.middleName = "Middle name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit Indian phone number";
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!formData.panNumber) {
      newErrors.panNumber = "PAN number is required";
    } else if (!panRegex.test(formData.panNumber.toUpperCase())) {
      newErrors.panNumber =
        "Please enter a valid PAN number (e.g., ABCDE1234F)";
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    } else {
      const dob = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18) {
        newErrors.dob = "You must be at least 18 years old";
      }
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state) {
      newErrors.state = "State is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }

    try {
      setIsSubmitting(true);
      const userId = getUserId();
      if (!userId) {
        toast.error("User data not found!");
        setIsSubmitting(false);
        return;
      }

      const kycResponse = await dispatch(createUser(formData));
      if (!kycResponse.success) {
        toast.error(kycResponse.message || "Failed to create KYC user");
        setIsSubmitting(false);
        return;
      }

      // Get payment details from localStorage
      const paymentDetails = JSON.parse(localStorage.getItem('paymentDetails') || '{}');
      const transactionId = localStorage.getItem('transactionId') || '';
      const amount = paymentDetails.amount || 0;
      const userData = localStorage.getItem('user');
      let user = {};
      try {
        user = userData ? JSON.parse(userData) : {};
      } catch (error) {}

      const invoiceData = {
        userid: userId,
        invoiceNo: `INV-${Date.now()}`,
        billDate: new Date().toISOString(),
        description: "Telegram Subscription Plan",
        price: amount,
        transactionId: transactionId,
        billedTo: {
          name: `${formData.firstName} ${formData.middleName || ''} ${formData.lastName}`.trim(),
          phone: formData.phone || user.phone || '',
          email: formData.email || user.email || '',
          address: formData.city || user.City || '',
          stateCode: user.stateCode || ''
        }
      };

      console.log("Invoice Data being sent:", invoiceData);

      const response = await axios.post(
        "http://localhost:4000/api/invoices",
        invoiceData,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.data) {
        toast.success("Invoice has been sent to your email!");
        const cloudinaryUrl = response.data?.invoice?.cloudinaryUrl;
        if (cloudinaryUrl) {
          window.open(cloudinaryUrl, '_blank');
        } else {
          toast.error("Invoice URL not found, cannot download invoice.");
        }
        localStorage.setItem('kycCompleted', 'true');
        navigate("/digio");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      if (error.response) {
        toast.error(error.response.data?.message || "Server error occurred");
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error(
          error.message || "Failed to process your request. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStates = INDIAN_STATES.filter((state) =>
    state.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const handleStateSelect = (state) => {
    setFormData((prev) => ({ ...prev, state }));
    setStateSearch("");
    setIsStateDropdownOpen(false);
    if (errors.state) {
      setErrors((prev) => ({ ...prev, state: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="w-full max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur-lg dark:bg-gray-800/95 p-4 sm:p-5 md:p-6 rounded-2xl shadow-2xl space-y-4 border border-gray-100/50 dark:border-gray-700/50 hover:shadow-blue-100/30 dark:hover:shadow-blue-900/30 transition-all duration-500"
        >
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent animate-gradient">
              KYC Form
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide">
              Complete your KYC verification to access all features
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex flex-col group">
              <label className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full p-2 sm:p-2.5 rounded-xl border-2 ${
                  errors.firstName
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                } dark:bg-gray-700/50 dark:text-white focus:border-transparent transition-all duration-300 text-sm placeholder-gray-400 dark:placeholder-gray-500 hover:border-blue-300 dark:hover:border-blue-500 outline-none shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500/20`}
              />
              {errors.firstName && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.firstName}
                </span>
              )}
            </div>
            <div className="flex flex-col group">
              <label className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                Middle Name
              </label>
              <input
                type="text"
                name="middleName"
                placeholder="Enter middle name"
                value={formData.middleName}
                onChange={handleChange}
                className={`w-full p-2 sm:p-2.5 rounded-xl border-2 ${
                  errors.middleName
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                } dark:bg-gray-700/50 dark:text-white focus:border-transparent transition-all duration-300 text-sm placeholder-gray-400 dark:placeholder-gray-500 hover:border-blue-300 dark:hover:border-blue-500 outline-none shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500/20`}
              />
              {errors.middleName && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.middleName}
                </span>
              )}
            </div>
            <div className="flex flex-col group">
              <label className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full p-2 sm:p-2.5 rounded-xl border-2 ${
                  errors.lastName
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                } dark:bg-gray-700/50 dark:text-white focus:border-transparent transition-all duration-300 text-sm placeholder-gray-400 dark:placeholder-gray-500 hover:border-blue-300 dark:hover:border-blue-500 outline-none shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500/20`}
              />
              {errors.lastName && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.lastName}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col group">
              <label className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-2 sm:p-2.5 rounded-xl border-2 ${
                  errors.email
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                } dark:bg-gray-700/50 dark:text-white focus:border-transparent transition-all duration-300 text-sm placeholder-gray-400 dark:placeholder-gray-500 hover:border-blue-300 dark:hover:border-blue-500 outline-none shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500/20`}
              />
              {errors.email && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.email}
                </span>
              )}
            </div>
            <div className="flex flex-col group">
              <label className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={`w-full p-2 sm:p-2.5 rounded-xl border-2 ${
                  errors.dob
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                } dark:bg-gray-700/50 dark:text-white focus:border-transparent transition-all duration-300 text-sm placeholder-gray-400 dark:placeholder-gray-500 hover:border-blue-300 dark:hover:border-blue-500 outline-none shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500/20`}
              />
              {errors.dob && (
                <span className="text-red-500 text-xs mt-1">{errors.dob}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col group">
              <label className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                placeholder="Enter city"
                value={formData.city}
                onChange={handleChange}
                className={`w-full p-2 sm:p-2.5 rounded-xl border-2 ${
                  errors.city
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                } dark:bg-gray-700/50 dark:text-white focus:border-transparent transition-all duration-300 text-sm placeholder-gray-400 dark:placeholder-gray-500 hover:border-blue-300 dark:hover:border-blue-500 outline-none shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500/20`}
              />
              {errors.city && (
                <span className="text-red-500 text-xs mt-1">{errors.city}</span>
              )}
            </div>
            <div className="flex flex-col group">
              <label className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                State <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div
                  onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                  className={`w-full p-2 sm:p-2.5 rounded-xl border-2 ${
                    errors.state
                      ? "border-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  } dark:bg-gray-700/50 dark:text-white focus:border-transparent transition-all duration-300 text-sm placeholder-gray-400 dark:placeholder-gray-500 hover:border-blue-300 dark:hover:border-blue-500 outline-none shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500/20 cursor-pointer flex items-center justify-between`}
                >
                  <span
                    className={
                      formData.state
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-gray-500"
                    }
                  >
                    {formData.state || "Select State"}
                  </span>
                  <svg
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${
                      isStateDropdownOpen ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {isStateDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-[200px] sm:max-h-[300px] overflow-hidden">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                      <input
                        type="text"
                        value={stateSearch}
                        onChange={(e) => setStateSearch(e.target.value)}
                        placeholder="Search state..."
                        className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="overflow-y-auto max-h-[150px] sm:max-h-[250px]">
                      {filteredStates.length > 0 ? (
                        filteredStates.map((state) => (
                          <div
                            key={state}
                            onClick={() => handleStateSelect(state)}
                            className="px-3 sm:px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer text-sm text-gray-700 dark:text-gray-300 transition-colors duration-150"
                          >
                            {state}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          No states found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.state && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.state}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col group">
              <label className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter 10-digit phone number"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full p-2 sm:p-2.5 rounded-xl border-2 ${
                  errors.phone
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                } dark:bg-gray-700/50 dark:text-white focus:border-transparent transition-all duration-300 text-sm placeholder-gray-400 dark:placeholder-gray-500 hover:border-blue-300 dark:hover:border-blue-500 outline-none shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500/20`}
              />
              {errors.phone && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.phone}
                </span>
              )}
            </div>
            <div className="flex flex-col group">
              <label className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                PAN Card Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="panNumber"
                placeholder="Enter PAN number (e.g., ABCDE1234F)"
                value={formData.panNumber}
                onChange={handleChange}
                className={`w-full p-2 sm:p-2.5 rounded-xl border-2 ${
                  errors.panNumber
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-600"
                } dark:bg-gray-700/50 dark:text-white focus:border-transparent transition-all duration-300 text-sm placeholder-gray-400 dark:placeholder-gray-500 hover:border-blue-300 dark:hover:border-blue-500 outline-none shadow-sm hover:shadow-md focus:shadow-lg focus:ring-2 focus:ring-blue-500/20`}
              />
              {errors.panNumber && (
                <span className="text-red-500 text-xs mt-1">
                  {errors.panNumber}
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm shadow-lg hover:shadow-xl hover:shadow-blue-500/20 ${
              isSubmitting ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit KYC"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
