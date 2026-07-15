import { ArrowLeft, Compass } from "lucide-react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import Brand from "./components/Brand.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicLayout from "./components/PublicLayout.jsx";
import AdminResourcePage from "./pages/AdminResourcePage.jsx";
import AssignmentsPage from "./pages/AssignmentsPage.jsx";
import CreateListingPage from "./pages/CreateListingPage.jsx";
import CourseDiscoveryPage from "./pages/CourseDiscoveryPage.jsx";
import CourseDetailsPage from "./pages/CourseDetailsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import { EarningsPage, PaymentsPage } from "./pages/FinancePages.jsx";
import MaterialsPage from "./pages/MaterialsPage.jsx";
import { ApplicationsPage, BookingsPage, BrowseRequestsPage, DashboardTutorsPage, MyListingsPage, ReviewsPage, SavedTutorsPage } from "./pages/MarketplacePages.jsx";
import MessagesPage from "./pages/MessagesPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ProgressPage from "./pages/ProgressPage.jsx";
import QuizzesPage from "./pages/QuizzesPage.jsx";
import SavedCoursesPage from "./pages/SavedCoursesPage.jsx";
import { NotificationsPage, ReportsPage, StudentMaterialsPage } from "./pages/UtilityPages.jsx";
import VerificationPage from "./pages/VerificationPage.jsx";
import AuthPage from "./pages/public/AuthPage.jsx";
import FindTutorsPage from "./pages/public/FindTutorsPage.jsx";
import HomePage from "./pages/public/HomePage.jsx";
import StaticPage from "./pages/public/StaticPage.jsx";
import StudentRequestsPage from "./pages/public/StudentRequestsPage.jsx";
import TutorDetailsPage from "./pages/public/TutorDetailsPage.jsx";

const RoleShell = ({ role }) => <ProtectedRoute roles={[role]}><DashboardLayout /></ProtectedRoute>;
const NotFound = () => <main className="not-found-page"><div className="not-found-brand"><Brand /></div><section><div className="not-found-code"><span>4</span><Compass size={70} /><span>4</span></div><p className="eyebrow">Wrong turn, useful detour</p><h1>This page left the lesson.</h1><p>The link may be old, or the page may have moved somewhere more useful.</p><Link className="button" to="/"><ArrowLeft size={16} /> Return to Mentor Market</Link></section></main>;

export default function App() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="tutors" element={<FindTutorsPage />} />
      <Route path="tutors/:id" element={<TutorDetailsPage />} />
      <Route path="student-requests" element={<StudentRequestsPage />} />
      <Route path="about" element={<StaticPage page="about" />} />
      <Route path="how-it-works" element={<StaticPage page="how-it-works" />} />
      <Route path="become-a-tutor" element={<StaticPage page="become-a-tutor" />} />
      <Route path="contact" element={<StaticPage page="contact" />} />
    </Route>
    <Route path="login" element={<AuthPage mode="login" />} />
    <Route path="register" element={<AuthPage mode="register" />} />

    <Route path="student" element={<RoleShell role="student" />}>
      <Route index element={<Navigate to="discover" replace />} /><Route path="discover" element={<CourseDiscoveryPage />} /><Route path="courses/:id" element={<CourseDetailsPage />} /><Route path="saved-courses" element={<SavedCoursesPage />} /><Route path="dashboard" element={<DashboardPage />} />
      <Route path="profile" element={<ProfilePage role="student" />} /><Route path="create-request" element={<CreateListingPage type="request" />} />
      <Route path="requests" element={<MyListingsPage type="request" />} /><Route path="tutors" element={<DashboardTutorsPage />} />
      <Route path="applications" element={<ApplicationsPage />} /><Route path="bookings" element={<BookingsPage />} />
      <Route path="messages" element={<MessagesPage />} /><Route path="materials" element={<StudentMaterialsPage />} />
      <Route path="assignments" element={<AssignmentsPage />} /><Route path="quizzes" element={<QuizzesPage />} />
      <Route path="progress" element={<ProgressPage />} /><Route path="payments" element={<PaymentsPage />} />
      <Route path="reviews" element={<ReviewsPage />} /><Route path="saved-tutors" element={<SavedTutorsPage />} />
      <Route path="notifications" element={<NotificationsPage />} /><Route path="reports" element={<ReportsPage />} />
    </Route>

    <Route path="tutor" element={<RoleShell role="tutor" />}>
      <Route index element={<Navigate to="dashboard" replace />} /><Route path="dashboard" element={<DashboardPage />} />
      <Route path="profile" element={<ProfilePage role="tutor" />} /><Route path="create-service" element={<CreateListingPage type="service" />} />
      <Route path="services" element={<MyListingsPage type="service" />} /><Route path="requests" element={<BrowseRequestsPage />} />
      <Route path="applications" element={<ApplicationsPage />} /><Route path="bookings" element={<BookingsPage />} />
      <Route path="messages" element={<MessagesPage />} /><Route path="materials" element={<MaterialsPage />} />
      <Route path="assignments" element={<AssignmentsPage />} /><Route path="quizzes" element={<QuizzesPage />} />
      <Route path="earnings" element={<EarningsPage />} /><Route path="reviews" element={<ReviewsPage />} />
      <Route path="verification" element={<VerificationPage />} /><Route path="notifications" element={<NotificationsPage />} />
      <Route path="reports" element={<ReportsPage />} />
    </Route>

    <Route path="admin" element={<RoleShell role="admin" />}>
      <Route index element={<Navigate to="dashboard" replace />} /><Route path="dashboard" element={<DashboardPage />} />
      {Object.keys({ users: 1, students: 1, tutors: 1, "tutor-posts": 1, "student-requests": 1, applications: 1, bookings: 1, payments: 1, reviews: 1, verifications: 1, reports: 1 }).map((type) => <Route key={type} path={type} element={<AdminResourcePage type={type} />} />)}
      <Route path="notifications" element={<NotificationsPage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>;
}
