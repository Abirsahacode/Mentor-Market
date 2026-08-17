import { ArrowLeft, Compass } from "lucide-react";
import { lazy, Suspense } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import Brand from "./components/Brand.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicLayout from "./components/PublicLayout.jsx";
import RouteEffects from "./components/RouteEffects.jsx";
import HomePage from "./pages/public/HomePage.jsx";

const DashboardLayout = lazy(() => import("./components/DashboardLayout.jsx"));
const AdminResourcePage = lazy(() => import("./pages/AdminResourcePage.jsx"));
const AssignmentsPage = lazy(() => import("./pages/AssignmentsPage.jsx"));
const CreateListingPage = lazy(() => import("./pages/CreateListingPage.jsx"));
const CourseDiscoveryPage = lazy(() => import("./pages/CourseDiscoveryPage.jsx"));
const CourseDetailsPage = lazy(() => import("./pages/CourseDetailsPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const MaterialsPage = lazy(() => import("./pages/MaterialsPage.jsx"));
const MessagesPage = lazy(() => import("./pages/MessagesPage.jsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.jsx"));
const ProgressPage = lazy(() => import("./pages/ProgressPage.jsx"));
const QuizzesPage = lazy(() => import("./pages/QuizzesPage.jsx"));
const SavedCoursesPage = lazy(() => import("./pages/SavedCoursesPage.jsx"));
const VerificationPage = lazy(() => import("./pages/VerificationPage.jsx"));
const AuthPage = lazy(() => import("./pages/public/AuthPage.jsx"));
const FindTutorsPage = lazy(() => import("./pages/public/FindTutorsPage.jsx"));
const StaticPage = lazy(() => import("./pages/public/StaticPage.jsx"));
const StudentRequestsPage = lazy(() => import("./pages/public/StudentRequestsPage.jsx"));
const TutorDetailsPage = lazy(() => import("./pages/public/TutorDetailsPage.jsx"));

const lazyNamed = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));
const EarningsPage = lazyNamed(() => import("./pages/FinancePages.jsx"), "EarningsPage");
const PaymentsPage = lazyNamed(() => import("./pages/FinancePages.jsx"), "PaymentsPage");
const ApplicationsPage = lazyNamed(() => import("./pages/MarketplacePages.jsx"), "ApplicationsPage");
const BookingsPage = lazyNamed(() => import("./pages/MarketplacePages.jsx"), "BookingsPage");
const BrowseRequestsPage = lazyNamed(() => import("./pages/MarketplacePages.jsx"), "BrowseRequestsPage");
const DashboardTutorsPage = lazyNamed(() => import("./pages/MarketplacePages.jsx"), "DashboardTutorsPage");
const MyListingsPage = lazyNamed(() => import("./pages/MarketplacePages.jsx"), "MyListingsPage");
const ReviewsPage = lazyNamed(() => import("./pages/MarketplacePages.jsx"), "ReviewsPage");
const SavedTutorsPage = lazyNamed(() => import("./pages/MarketplacePages.jsx"), "SavedTutorsPage");
const NotificationsPage = lazyNamed(() => import("./pages/UtilityPages.jsx"), "NotificationsPage");
const ReportsPage = lazyNamed(() => import("./pages/UtilityPages.jsx"), "ReportsPage");
const StudentMaterialsPage = lazyNamed(() => import("./pages/UtilityPages.jsx"), "StudentMaterialsPage");

const RoleShell = ({ role }) => <ProtectedRoute roles={[role]}><DashboardLayout /></ProtectedRoute>;
const NotFound = () => <main className="not-found-page"><div className="not-found-brand"><Brand /></div><section><div className="not-found-code"><span>4</span><Compass size={70} /><span>4</span></div><p className="eyebrow">Wrong turn, useful detour</p><h1>This page left the lesson.</h1><p>The link may be old, or the page may have moved somewhere more useful.</p><Link className="button" to="/"><ArrowLeft size={16} /> Return to Mentor Market</Link></section></main>;

export default function App() {
  return <><RouteEffects /><Suspense fallback={<main className="route-loading"><LoadingSpinner label="Loading page" detail="Preparing Mentor Market" /></main>}><Routes>
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
  </Routes></Suspense></>;
}
