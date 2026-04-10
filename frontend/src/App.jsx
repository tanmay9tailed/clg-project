import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { LoadingBlock } from "./components/LoadingBlock";
import { ShellLayout } from "./components/ShellLayout";

const HomePage = lazy(() =>
  import("./pages/HomePage").then((module) => ({ default: module.HomePage }))
);
const StudentDashboardPage = lazy(() =>
  import("./pages/StudentDashboardPage").then((module) => ({
    default: module.StudentDashboardPage
  }))
);
const AddAchievementPage = lazy(() =>
  import("./pages/AddAchievementPage").then((module) => ({
    default: module.AddAchievementPage
  }))
);
const PublicProfilePage = lazy(() =>
  import("./pages/PublicProfilePage").then((module) => ({
    default: module.PublicProfilePage
  }))
);
const IssuerDashboardPage = lazy(() =>
  import("./pages/IssuerDashboardPage").then((module) => ({
    default: module.IssuerDashboardPage
  }))
);

const App = () => (
  <Suspense fallback={<LoadingBlock label="Loading workspace..." />}>
    <Routes>
      <Route element={<ShellLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<StudentDashboardPage />} />
        <Route path="/achievements/new" element={<AddAchievementPage />} />
        <Route path="/u/:address" element={<PublicProfilePage />} />
        <Route path="/issuer" element={<IssuerDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </Suspense>
);

export default App;
