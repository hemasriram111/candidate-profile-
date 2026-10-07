import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './components/common/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { CandidateLayout } from './components/candidate/CandidateLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { PublicLayout } from './layouts/PublicLayout'
import {
  CandidateAIAssistantPage,
  CandidateApplicationDetailPage,
  CandidateApplicationsPage,
  CandidateHomePage,
  CandidateInterviewsPage,
  CandidateJobAlertsPage,
  CandidateJobDetailsPage,
  CandidateJobsPage,
  CandidateMessagesPage,
  CandidateNotificationsPage,
  CandidateOffersPage,
  CandidateProfilePage,
  CandidateProfileViewsPage,
  CandidateSavedJobsPage,
  CandidateSettingsPage,
} from './pages/candidate/CandidatePages'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { ResumeOnboardingPage } from './pages/candidate/ResumeOnboardingPage'
import { CandidateResumePage } from './pages/candidate/CandidateResumePage'
import { AboutPage } from './pages/public/AboutPage'
import { CompaniesPage } from './pages/public/CompaniesPage'
import { CompanyDetailPage } from './pages/public/CompanyDetailPage'
import { ContactPage } from './pages/public/ContactPage'
import { HomePage } from './pages/public/HomePage'
import { JobDetailPage } from './pages/public/JobDetailPage'
import { JobsPage } from './pages/public/JobsPage'
import { ResourcesPage } from './pages/public/ResourcesPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:companyId" element={<CompanyDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        <Route path="/candidate/onboarding" element={<ProtectedRoute requiredRole="candidate"><ResumeOnboardingPage /></ProtectedRoute>} />
        <Route path="/candidate/upload-resume" element={<ProtectedRoute requiredRole="candidate"><ResumeOnboardingPage /></ProtectedRoute>} />

        <Route path="/candidate" element={<ProtectedRoute requiredRole="candidate" requireCandidateOnboarding><CandidateLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/candidate/dashboard" replace />} />
          <Route path="profile" element={<CandidateProfilePage />} />
          <Route path="resume" element={<CandidateResumePage />} />
          <Route path="jobs" element={<CandidateJobsPage />} />
          <Route path="jobs/:id" element={<CandidateJobDetailsPage />} />
          <Route path="saved-jobs" element={<CandidateSavedJobsPage />} />
          <Route path="applications" element={<CandidateApplicationsPage />} />
          <Route path="applications/:id" element={<CandidateApplicationDetailPage />} />
          <Route path="interviews" element={<CandidateInterviewsPage />} />
          <Route path="offers" element={<CandidateOffersPage />} />
          <Route path="messages" element={<CandidateMessagesPage />} />
          <Route path="notifications" element={<CandidateNotificationsPage />} />
          <Route path="job-alerts" element={<CandidateJobAlertsPage />} />
          <Route path="ai-assistant" element={<CandidateAIAssistantPage />} />
          <Route path="profile-views" element={<CandidateProfileViewsPage />} />
          <Route path="settings" element={<CandidateSettingsPage />} />
          <Route path="dashboard" element={<CandidateHomePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
