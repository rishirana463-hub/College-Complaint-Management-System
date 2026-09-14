import { lazy, Suspense } from "react";
import {
  ArrowUpRight,
  ShieldCheck,
  MessageSquare,
  CheckCheck,
  Sun,
  Moon,
} from "lucide-react";
import { Brand } from "./Sidebar";
import { useTheme } from "../context/ThemeContext";
import CampusBook from "./login/CampusBook";
import "./login/CampusBook.css";
import ColorBends from "./reactbits/ColorBends";
import DotField from "./reactbits/DotField";
const SpotlightCard = lazy(() => import("./reactbits/SpotlightCard"));
export default function AuthLayout({
  children,
  showBook = false,
  showThemeToggle = true,
}) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="auth-layout">
      <DotField
        dotRadius={0.9}
        dotSpacing={22}
        color="rgba(92, 125, 88, 0.55)"
      />
      <ColorBends
        color="#9BB86B"
        speed={0.2}
        frequency={0.85}
        noise={0.15}
        bandWidth={0.1}
        rotation={90}
        intensity={0.4}
        fadeTop={0.75}
      />
      <section className="auth-story">
        <Brand />
        <div className="auth-story-main">
          <span className="auth-kicker">
            <span className="live-dot" />
            YOUR VOICE. REAL PROGRESS.
          </span>
          <h1>
            A better campus
            <br />
            starts with
            <br />
            <em>being heard.</em>
          </h1>
          <p>
            One place to raise a concern, follow the conversation, and see
            things get better.
          </p>
          {showBook ? (
            <CampusBook />
          ) : (
            <Suspense fallback={<div className="auth-demo-fallback" />}>
              <SpotlightCard className="auth-demo-card">
                <div className="auth-demo-heading">
                  <span className="demo-icon">
                    <MessageSquare size={19} />
                  </span>
                  <div>
                    <strong>Every issue has a next step.</strong>
                    <small>Clear updates, from start to finish</small>
                  </div>
                  <ArrowUpRight size={20} />
                </div>
                <div className="demo-workflow">
                  <span>
                    <CheckCheck size={14} />
                    Submitted
                  </span>
                  <i />
                  <span>In progress</span>
                  <i />
                  <span>Resolved</span>
                </div>
              </SpotlightCard>
            </Suspense>
          )}
        </div>
        <div className="auth-story-footer">
          <ShieldCheck size={16} />
          Thoughtful support for your college community.
        </div>
      </section>
      <section className="auth-form-side">
        {showThemeToggle && (
          <button
            className="icon-button auth-theme"
            aria-label="Switch color theme"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-form-container">{children}</div>
        <footer>College Complaint & Ticket Management System</footer>
      </section>
    </div>
  );
}
