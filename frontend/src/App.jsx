import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "react-hot-toast";
import Root from "./components/Root";
import Home from "./components/Home";
import Register from "./components/Register";
import Login from "./components/Login";
import Profile from "./components/Profile";
import UploadResume from "./components/UploadResume";
import MyResumes from "./components/MyResumes";
import ResumeDetail from "./components/ResumeDetail";
import AnalysisResult from "./components/AnalysisResult";
import EditSkills from "./components/EditSkills";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./components/Unauthorized";

function App() {
  const routerObj = createBrowserRouter([
    {
      path: "/",
      element: <Root />,
      children: [
        {
          path: "",
          element: <Home />,
        },
        {
          path: "register",
          element: <Register />,
        },
        {
          path: "login",
          element: <Login />,
        },
        {
          path: "profile",
          element: (
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          ),
          children: [
            {
              index: true,
              element: <MyResumes />,
            },
            {
              path: "resumes",
              element: <MyResumes />,
            },
            {
              path: "upload",
              element: <UploadResume />,
            },
          ],
        },
        {
          path: "resume/:id",
          element: (
            <ProtectedRoute>
              <ResumeDetail />
            </ProtectedRoute>
          ),
        },
        {
          path: "analysis/:resumeId",
          element: (
            <ProtectedRoute>
              <AnalysisResult />
            </ProtectedRoute>
          ),
        },
        {
          path: "analysis/:resumeId/edit-skills",
          element: (
            <ProtectedRoute>
              <EditSkills />
            </ProtectedRoute>
          ),
        },

        {
          path: "unauthorized",
          element: <Unauthorized />,
        },
      ],
    },
  ]);

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <RouterProvider router={routerObj} />
    </div>
  );
}

export default App;
