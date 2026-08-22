import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const AdminContent = lazy(() => import("./pages/AdminContent"));
const HadithTransparency = lazy(() => import("./pages/HadithTransparency"));
const Suggestions = lazy(() => import("./pages/Suggestions"));

function RouteFallback() {
  return <main className="route-loading" role="status">جارٍ تحميل الصفحة…</main>;
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/التوثيق" component={HadithTransparency} />
        <Route path="/اقتراحاتي" component={Suggestions} />
        <Route path="/admin" component={AdminContent} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster richColors position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
