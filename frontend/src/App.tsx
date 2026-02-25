import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import OnboardBusiness from "./pages/OnboardBusiness";
import PaymentPage from "./pages/PaymentPage";
import HomePage from "./pages/HomePage";
import VerifyBusiness from "./pages/VerifyBusiness";
import VerificationStatus from "./pages/VerificationStatus";
import EmbeddedOnboarding from "./pages/EmbeddedOnboarding";
import DirectOnboarding from "./pages/DirectOnboarding";
import PayoutManagement from "./pages/PayoutManagement";
import BankAccountsPage from "./pages/BankAccounts/BankAccountsPage";
import PayoutSchedulePage from "./pages/BankAccounts/PayoutSchedulePage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-lg font-semibold text-gray-900 hover:text-indigo-600"
                >
                  🎯 Stripe Connect Demo
                </Link>
                <Link
                  to="/onboard"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Onboard Business
                </Link>
                <Link
                  to="/payment"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Make Payment
                </Link>
                <Link
                  to="/payouts"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Payout Management
                </Link>
                <Link
                  to="/bank-accounts"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Bank Accounts
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/onboard" element={<OnboardBusiness />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payouts" element={<PayoutManagement />} />
            <Route path="/verify/:businessId" element={<VerifyBusiness />} />
            <Route
              path="/onboarding/:businessId"
              element={<EmbeddedOnboarding />}
            />
            <Route
              path="/direct-onboarding/:businessId"
              element={<DirectOnboarding />}
            />
            <Route
              path="/verification-status/:businessId"
              element={<VerificationStatus />}
            />
            <Route
              path="/bank-accounts/:businessId"
              element={<BankAccountsPage />}
            />
            <Route
              path="/bank-accounts/:businessId/payout-schedule"
              element={<PayoutSchedulePage />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
