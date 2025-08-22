import React, { useEffect, useState } from "react";
import { CheckCircle, ArrowDownCircle, FileClock, Circle, AlertCircle, Link as LinkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "./Card";
import SubscriptionStatus from "../Subscription/SubscriptionStatus";
import axios from 'axios';

const getStepStatus = (stepNumber, currentStep) => {
    const userPhone = localStorage.getItem('userPhone');
    
    if (stepNumber === 1) {
        return userPhone ? "completed" : "current";
    }
    if (stepNumber === 2) {
        if (!userPhone) return "pending";
        const paymentCompleted = localStorage.getItem('paymentCompleted');
        return paymentCompleted && paymentCompleted.toLowerCase() === 'true' ? "completed" : "current";
    }
    if (stepNumber === 3) {
        if (!userPhone) return "pending";
        const kycCompleted = localStorage.getItem('kycCompleted');
        return kycCompleted ? "completed" : "current";
    }
    if (stepNumber === 4) {
        if (!userPhone) return "pending";
        const digioCompleted = localStorage.getItem('digioCompleted');
        return digioCompleted ? "completed" : "current";
    }
    if (stepNumber < currentStep) return "completed";
    if (stepNumber === currentStep) return "current";
    return "pending";
};

const getStepIcon = (status, defaultIcon) => {
    if (status === "completed") return CheckCircle;
    if (status === "current") return AlertCircle;
    if (status === "pending") return Circle;
    return defaultIcon;
};

const steps = [
    {
        title: "Step 1",
        description: "Register With Mobile number and OTP",
        icon: CheckCircle
    },
    {
        title: "Step 2",
        description: "Select Plans and make Payment",
        icon: FileClock
    },
    {
        title: "Step 3",
        description: "Complete KYC And Receive Link",
        icon: ArrowDownCircle,
    },
    {
        title: "Step 4",
        description: "Sign Document with Digio",
        icon: FileClock,
    }
];

export default function HowItWorks() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showPlans, setShowPlans] = useState(false);
    const [telegramLink, setTelegramLink] = useState(localStorage.getItem('telegramLink') || "");
    const navigate = useNavigate();

    const fetchInviteLink = async () => {
        try {
            if (localStorage.getItem('telegramLink')) {
                setTelegramLink(localStorage.getItem('telegramLink'));
                return;
            }

            console.log('Fetching invite link...');
            const response = await axios.get('http://localhost:4000/api/invite/invite-link');
            
            if (response.data.link) {
                console.log('Setting link:', response.data.link);
                localStorage.setItem('telegramLink', response.data.link);
                setTelegramLink(response.data.link);
            } else {
                console.error('No link found in response');
                setTelegramLink("Link not available");
            }
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            if (!localStorage.getItem('telegramLink')) {
                setTelegramLink("Error loading link");
            }
        }
    };

    useEffect(() => {
        let isMounted = true;
        let timeoutId = null;

        const checkLoginStatus = () => {
            try {
                if (!isMounted) return;

                const userPhone = localStorage.getItem('userPhone');
                const paymentCompleted = localStorage.getItem('paymentCompleted');
                const kycCompleted = localStorage.getItem('kycCompleted');
                const digioCompleted = localStorage.getItem('digioCompleted');

                if (userPhone) {
                    setIsLoggedIn(true);
                    if (digioCompleted === 'true') {
                        setCurrentStep(4);
                        if (!localStorage.getItem('telegramLink')) {
                            fetchInviteLink();
                        }
                    } else if (kycCompleted === 'true') {
                        setCurrentStep(3);
                    } else if (paymentCompleted === 'true') {
                        setCurrentStep(2); // Always set to 2 if payment is done but KYC is not
                    } else {
                        setCurrentStep(2);
                        setShowPlans(true);
                    }
                } else {
                    setIsLoggedIn(false);
                    setCurrentStep(1);
                    setShowPlans(false);
                }
            } catch (error) {
                console.error('Error in checkLoginStatus:', error);
                if (isMounted) {
                    setIsLoggedIn(false);
                    setCurrentStep(1);
                    setShowPlans(false);
                }
            }
        };

        checkLoginStatus();

        timeoutId = setInterval(checkLoginStatus, 1000); // Faster update

        window.addEventListener('storage', checkLoginStatus);

        return () => {
            isMounted = false;
            if (timeoutId) {
                clearInterval(timeoutId);
            }
            window.removeEventListener('storage', checkLoginStatus);
        };
    }, []);

    useEffect(() => {
        // Check payment status if currentOrderId exists
        const checkPaymentStatus = async () => {
            const orderId = localStorage.getItem('currentOrderId');
            if (orderId) {
                try {
                    const response = await axios.get(`http://localhost:4000/api/payment/status/by-link/${orderId}`);
                    if (response.data.status === 'SUCCESS' || response.data.data?.status === 'SUCCESS') {
                        localStorage.setItem('paymentCompleted', 'true');
                        localStorage.removeItem('currentOrderId');
                    }
                } catch (error) {
                    // Optionally handle error
                }
            }
        };
        checkPaymentStatus();
    }, []);

    const handleStepClick = (stepNumber) => {
        const userPhone = localStorage.getItem('userPhone');
        const paymentCompleted = localStorage.getItem('paymentCompleted');
        const kycCompleted = localStorage.getItem('kycCompleted');

        if (stepNumber === 1) {
            if (!userPhone) {
                navigate('/login');
            }
            return;
        }

        if (!userPhone) {
            navigate('/login');
            return;
        }

        if (stepNumber === 2) {
            setShowPlans(true);
        } else if (stepNumber === 3) {
            if (userPhone && paymentCompleted && !kycCompleted) {
                navigate('/kycForm');
            }
        } else if (stepNumber === 4) {
            if (userPhone && paymentCompleted && kycCompleted) {
                navigate('/digio');
            }
        }
    };

    const isClickable = (index) => {
        const userPhone = localStorage.getItem('userPhone');
        return index === 0 || (index > 0 && userPhone);
    };

    const isAllStepsCompleted = () => {
        const userPhone = localStorage.getItem('userPhone');
        const paymentCompleted = localStorage.getItem('paymentCompleted');
        const kycCompleted = localStorage.getItem('kycCompleted');
        const digioCompleted = localStorage.getItem('digioCompleted');
        
        const isCompleted = Boolean(userPhone) && Boolean(paymentCompleted) && Boolean(kycCompleted) && Boolean(digioCompleted);
        
        return isCompleted;
    };

    useEffect(() => {
        const checkCompletion = () => {
            const completed = isAllStepsCompleted();
        };

        checkCompletion();

        window.addEventListener('storage', checkCompletion);
        
        return () => window.removeEventListener('storage', checkCompletion);
    }, []);

    return (
        <div className="relative">
            {isAllStepsCompleted() ? (
                <div className="max-w-full sm:max-w-xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
                    <div className="p-4 sm:p-6 border-2 border-green-500 rounded-lg shadow-lg bg-white dark:bg-gray-800">
                        <p className="text-center text-green-600 font-medium text-base sm:text-lg mb-4">
                            {"Congratulations! You have successfully completed all the required steps."}
                        </p>
                        
                        {/* Telegram ID Setup Notification */}
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                        Important: Set Your Telegram ID
                                    </h4>
                                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                                        To ensure proper access management, please set your Telegram User ID. 
                                        <a 
                                            href="/telegram-id" 
                                            className="ml-1 font-medium underline hover:no-underline"
                                        >
                                            Click here to set it now
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                                        <LinkIcon className="text-blue-500 dark:text-blue-300" size={18} />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">Your Telegram Link:</span>
                                </div>
                                <button
                                    onClick={() => {
                                        const link = localStorage.getItem('telegramLink') || "https://t.me/demo_bot_123";
                                        navigator.clipboard.writeText(link).then(() => {
                                            // Show success message
                                            const button = event.target.closest('button');
                                            const originalText = button.innerHTML;
                                            button.innerHTML = `
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Copied!
                                            `;
                                            button.className = button.className.replace('bg-blue-500 hover:bg-blue-600', 'bg-green-500');
                                            
                                            setTimeout(() => {
                                                button.innerHTML = originalText;
                                                button.className = button.className.replace('bg-green-500', 'bg-blue-500 hover:bg-blue-600');
                                            }, 2000);
                                        }).catch(() => {
                                            alert('Failed to copy link. Please copy manually:\n\n' + link);
                                        });
                                    }}
                                    className="px-3 py-1.5 text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                    </svg>
                                    Copy Link
                                </button>
                            </div>
                            <div className="mt-3 p-2.5 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm">
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 break-all font-mono">
                                    {telegramLink || "Loading..."}
                                </p>
                            </div>
                            <div className="mt-3 flex justify-center">
                                <button 
                                    onClick={() => {
                                        if (telegramLink && telegramLink.startsWith('tg://')) {
                                            // For tg:// links, show instructions since browsers block them
                                            const message = `🔗 Telegram Link Instructions:\n\n1. Copy this link: ${telegramLink}\n2. Open Telegram app\n3. Paste the link in any chat\n4. Tap the link to join the channel\n\nOr click "Copy Link" button above and paste it in Telegram.`;
                                            alert(message);
                                        } else if (telegramLink && telegramLink.startsWith('https://t.me/')) {
                                            // For https://t.me/ links, open normally
                                            window.open(telegramLink, '_blank');
                                        } else {
                                            alert('Invalid Telegram link format');
                                        }
                                    }}
                                    disabled={!telegramLink}
                                    className={`px-4 py-2 text-xs sm:text-sm ${telegramLink ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 w-full sm:w-auto`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                    </svg>
                                    Open in Telegram
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="max-w-full sm:max-w-xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 dark:text-white bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            How it Works
                        </h2>
                        <div className="relative ml-0 sm:ml-6 space-y-6 sm:space-y-8">
                            {steps.map((step, index) => {
                                const status = getStepStatus(index + 1, currentStep, isLoggedIn);
                                const canClick = isClickable(index);
                                
                                return (
                                    <div 
                                        key={index} 
                                        className={`group flex items-start relative transition-all duration-300 hover:scale-[1.02] ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
                                        onClick={() => canClick && handleStepClick(index + 1)}
                                    >
                                        <div className={`relative z-10 w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300
                                            ${status === "completed" ? "bg-green-500 border-green-500 shadow-lg shadow-green-500/30 group-hover:shadow-xl" :
                                                status === "current" ? "bg-red-500 border-red-500 shadow-lg shadow-red-500/30 group-hover:shadow-xl" :
                                                "bg-white dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-600 group-hover:border-gray-500 dark:group-hover:border-gray-500"}
                                        `}>
                                            {React.createElement(getStepIcon(status, step.icon), {
                                                className: `
                                                    transition-all duration-300 group-hover:scale-110
                                                    ${status === "completed" ? "text-white" :
                                                        status === "current" ? "text-white" :
                                                        "text-gray-500 dark:text-gray-400"}
                                                `,
                                                size: 24
                                            })}
                                        </div>

                                        <div className={`ml-4 sm:ml-6 px-4 py-3 sm:px-6 sm:py-4 rounded-xl flex-1 relative transition-all duration-300
                                            ${status === "current" ? "shadow-lg shadow-red-500/20 bg-white dark:bg-gray-800 group-hover:shadow-xl" : 
                                            status === "completed" ? "bg-white dark:bg-gray-800 shadow-lg shadow-green-500/20 group-hover:shadow-xl" :
                                            "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm group-hover:bg-white dark:group-hover:bg-gray-800 group-hover:shadow-lg"}
                                        `}>
                                            <h3 className={`text-base sm:text-lg font-semibold mb-2 transition-colors duration-300
                                                ${status === "completed" ? "text-green-600 dark:text-green-400" :
                                                    status === "current" ? "text-black dark:text-white" :
                                                    "text-black dark:text-white"}
                                            `}>
                                                {step.title}
                                            </h3>
                                            <p className={`text-sm sm:text-base transition-colors duration-300
                                                ${status === "completed" ? "text-green-600 dark:text-green-400" :
                                                    status === "current" ? "text-gray-700 dark:text-gray-200" :
                                                    "text-gray-600 dark:text-gray-300"}
                                            `}>
                                                {status === "completed" ? "This step is completed" : step.description}
                                            </p>
                                        </div>

                                        {index < steps.length - 1 && (
                                            <div className="absolute left-5 sm:left-6 top-12 sm:top-14 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 -ml-px"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {showPlans && (
                        <div className="mt-8 px-4 sm:px-6">
                            <Card />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
