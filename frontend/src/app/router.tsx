import { createBrowserRouter, Navigate } from "react-router-dom";
import { Shell } from "./Shell";
import { LandingPage } from "../pages/LandingPage";
import { ExplorePage } from "../pages/ExplorePage";
import { SafetyPage } from "../pages/SafetyPage";
import { RoutePage } from "../pages/RoutePage";
import { ComparePage } from "../pages/ComparePage";
import { HeritagePage } from "../pages/HeritagePage";
import { DashboardPage } from "../pages/DashboardPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Shell />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "explore",
        element: <ExplorePage />,
      },
      {
        path: "route",
        element: <RoutePage />,
      },
      {
        path: "safety",
        element: <SafetyPage />,
      },
      {
        path: "heritage",
        element: <HeritagePage />,
      },
      {
        path: "compare",
        element: <ComparePage />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
