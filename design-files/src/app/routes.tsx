import { createBrowserRouter } from "react-router";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { HomeView } from "./components/HomeView";
import { ChatView } from "./components/ChatView";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: WelcomeScreen,
  },
  {
    path: "/home",
    Component: HomeView,
  },
  {
    path: "/chat/:tripId?",
    Component: ChatView,
  },
]);
