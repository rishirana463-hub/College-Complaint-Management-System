import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  Plus,
  Inbox,
  ChartNoAxesCombined,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { navigationFor } from "../lib/navigation";
import { MagneticDock } from "./ui/magnetic-dock";

const icons = {
  overview: LayoutDashboard,
  tickets: Ticket,
  plus: Plus,
  inbox: Inbox,
  analytics: ChartNoAxesCombined,
  activity: Activity,
};
const captions = {
  overview: "Home",
  tickets: "Tickets",
  plus: "New",
  inbox: "Inbox",
  analytics: "Insights",
  activity: "Activity",
};

export default function DockNavigation({ unreadCount = 0 }) {
  const { auth } = useAuth();
  const { pathname } = useLocation();
  const items = navigationFor(auth.user.role).map((item) => {
    const Icon = icons[item.icon];
    return {
      id: item.icon,
      to: item.path,
      label: item.label,
      shortLabel: captions[item.icon],
      icon: <Icon size={26} strokeWidth={1.7} />,
      isActive:
        pathname === item.path ||
        (item.path === "/tickets" && pathname.startsWith("/tickets/")),
      badge: item.icon === "inbox" ? unreadCount : undefined,
    };
  });
  return (
    <div className="dock-position">
      <MagneticDock items={items} />
    </div>
  );
}
