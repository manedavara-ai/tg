import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import Header from "./Component/Header/Header";
import Home from "./Component/Home/Home";
import Login from "./Component/Login/Login";
import OTP from "./Component/Login/OTP";
import KYCForm from "./Component/KYC/Kycform";
import LoginAdmin from "./pages/LoginAdmin";
import Footer from "./Component/Footer/Footer";
import Layout from "./Adminpanel/Layout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import AddPlanForm from "./pages/AddPlans";
import ProtectedRoute from "./Adminpanel/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import ViewPlans from "./pages/ViewPlans";
import KycProtectedRoute from "./Component/KYC/KycProtectedRoute";
import Digio from "./Component/DIGIO/Digio";
import DigioProtectedRoute from "./Component/DIGIO/DigioProtectedRoute";
import DigioErrors from "./pages/DigioErrors";
import KickedUsers from "./pages/KickedUsers";
import TelegramIdForm from "./Component/TelegramId/TelegramIdForm";
import CreateAdmin from "./pages/CreateAdmin";
import Group from "./pages/Group";
import CreateGroup from "./pages/CreateGroup";
import Setuppage from "./pages/Setup-page";

function App() {
  const location = useLocation();

  return (
    <>
      {location.pathname === "/" && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/otp" element={<OTP />} />
        <Route path="/payment/:id" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentSuccess />} />
        <Route 
          path="/kycForm" 
          element={
            <KycProtectedRoute>
              <KYCForm />
            </KycProtectedRoute>
          } 
        />
        <Route 
          path="/digio" 
          element={
            <DigioProtectedRoute>
              <Digio />
            </DigioProtectedRoute>
          }
        />
        <Route
          path="/loginAdmin"
          element={
            localStorage.getItem("auth") === "true" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <LoginAdmin />
            )
          }
        />
        <Route path="/telegram-id" element={<TelegramIdForm />} />

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="addplans" element={<AddPlanForm />} />
          <Route path="viewplans" element={<ViewPlans />} />
          <Route path="digio-errors" element={<DigioErrors />} />
          <Route path="kicked-users" element={<KickedUsers />} />
          <Route path="create-admin" element={<CreateAdmin />} />
          <Route path="Group" element={<Group />} />
          <Route path="Create-group" element={<CreateGroup  />} />
          <Route path="Setup-page" element={<Setuppage  />} />

        </Route>
            
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {location.pathname === "/" && <Footer />}
      <ToastContainer position="top-right" autoClose={4000} />
    </>
  );
}

export default App;
