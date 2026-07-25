import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  Truck,
  Store,
  CreditCard,
  PieChart,
  Settings,
  X,
  Receipt,
  ClipboardList,
  FileText,
  Shield,
  LogOut,
  ChevronDown,
  Users,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { removeAuthToken } from "../services/axios";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type MenuChild = {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Hide unless user role is in this list */
  roles?: string[];
};

type MenuGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  children: MenuChild[];
};

const canAccessChild = (child: MenuChild, role: string) => {
  if (!child.roles?.length) return true;
  return child.roles.includes(role);
};

const groupHasVisibleChildren = (group: MenuGroup, role: string) =>
  group.children.some((child) => canAccessChild(child, role));

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [adminData, setAdminData] = useState<{
    name?: string;
    role?: string;
  } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storedAdmin = localStorage.getItem("adminData");
    if (storedAdmin) {
      try {
        setAdminData(JSON.parse(storedAdmin));
      } catch (error) {
        console.error("Error parsing admin data:", error);
      }
    }
  }, []);

  const userRole = adminData?.role || currentUser.role;

  const menuGroups: MenuGroup[] = useMemo(
    () => [
      {
        id: "sales",
        label: t("sidebar.groupSales"),
        icon: ShoppingCart,
        children: [
          {
            path: "/pos",
            label: t("sidebar.checkout"),
            icon: ShoppingCart,
            roles: ["admin", "owner", "cashier"],
          },
          {
            path: "/direct-sale",
            label: t("sidebar.directSale"),
            icon: ShoppingBag,
            roles: ["admin", "owner", "cashier"],
          },
          {
            path: "/quotations/create",
            label: t("sidebar.createQuotation"),
            icon: FileText,
            roles: ["admin", "owner", "cashier"],
          },
        ],
      },
      {
        id: "orders",
        label: t("sidebar.groupOrders"),
        icon: Receipt,
        children: [
          {
            path: "/orders",
            label: t("sidebar.orders"),
            icon: Receipt,
            roles: ["admin", "owner", "cashier"],
          },
          {
            path: "/direct-sale-orders",
            label: t("sidebar.directSaleOrders"),
            icon: ClipboardList,
            roles: ["admin", "owner", "cashier"],
          },
          {
            path: "/credit-orders",
            label: t("sidebar.creditOrder"),
            icon: CreditCard,
            roles: ["admin", "owner", "cashier"],
          },
          {
            path: "/quotations",
            label: t("sidebar.quotations"),
            icon: FileText,
            roles: ["admin", "owner", "cashier"],
          },
        ],
      },
      {
        id: "inventory",
        label: t("sidebar.groupInventory"),
        icon: Package,
        children: [
          {
            path: "/inventory",
            label: t("sidebar.inventory"),
            icon: Package,
            roles: ["admin", "owner", "inventory-manager"],
          },
          {
            path: "/warehouse",
            label: t("sidebar.warehouse"),
            icon: Truck,
            roles: ["admin", "owner", "inventory-manager"],
          },
          {
            path: "/storefront",
            label: t("sidebar.storefront"),
            icon: Store,
            roles: ["admin", "owner", "inventory-manager"],
          },
        ],
      },
      {
        id: "purchasing",
        label: t("sidebar.groupPurchasing"),
        icon: ShoppingBag,
        children: [
          {
            path: "/suppliers",
            label: t("sidebar.suppliers"),
            icon: Users,
            roles: ["admin", "owner"],
          },
          {
            path: "/purchasing",
            label: t("sidebar.purchasing"),
            icon: ShoppingBag,
            roles: ["admin", "owner"],
          },
          {
            path: "/purchase-report",
            label: t("sidebar.purchaseReport"),
            icon: ClipboardList,
            roles: ["admin", "owner"],
          },
        ],
      },
      {
        id: "finance",
        label: t("sidebar.groupFinance"),
        icon: PieChart,
        children: [
          {
            path: "/credits",
            label: t("sidebar.creditSales"),
            icon: CreditCard,
            roles: ["admin", "owner"],
          },
          {
            path: "/expenses",
            label: t("sidebar.expenses"),
            icon: PieChart,
            roles: ["admin", "owner"],
          },
          {
            path: "/reports",
            label: t("sidebar.reports"),
            icon: LayoutDashboard,
            roles: ["admin", "owner"],
          },
        ],
      },
      {
        id: "system",
        label: t("sidebar.groupSystem"),
        icon: Shield,
        children: [
          // {
          //   path: "/ai-chat",
          //   label: t("sidebar.aiAssistant"),
          //   icon: MessageSquare,
          // },
          {
            path: "/accounts",
            label: t("sidebar.accountManagement"),
            icon: Shield,
            roles: ["owner"],
          },
        ],
      },
    ],
    [t],
  );

  const visibleGroups = useMemo(
    () => menuGroups.filter((g) => groupHasVisibleChildren(g, userRole)),
    [menuGroups, userRole],
  );

  const isChildActive = (path: string) => {
    return location.pathname === path;
  };

  const groupContainsActiveRoute = (group: MenuGroup) =>
    group.children.some(
      (child) => canAccessChild(child, userRole) && isChildActive(child.path),
    );

  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      visibleGroups.forEach((group) => {
        if (groupContainsActiveRoute(group)) {
          next.add(group.id);
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, userRole]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("adminData");
    toast.success(t("sidebar.loggedOut"));
    navigate("/login");
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`sidebar w-72 bg-brand text-white flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl print:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/shewpyi.jpg"
              alt="shewpyi-erp Logo"
              className="w-10 h-10 object-contain rounded-lg"
            />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Shwepyi-ERP
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-thin">
          <ul className="space-y-1">
            {visibleGroups.map((group) => {
              const GroupIcon = group.icon;
              const isExpanded = expandedGroups.has(group.id);
              const isGroupActive = groupContainsActiveRoute(group);
              const visibleChildren = group.children.filter((child) =>
                canAccessChild(child, userRole),
              );

              return (
                <li key={group.id} className="rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      isGroupActive
                        ? "bg-white/15 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                    aria-expanded={isExpanded}
                  >
                    <GroupIcon className="w-5 h-5 shrink-0 opacity-90" />
                    <span className="flex-1 text-left truncate">
                      {group.label}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <ul className="overflow-hidden min-h-0">
                      {visibleChildren.map((child) => {
                        const ChildIcon = child.icon;
                        const active = isChildActive(child.path);

                        return (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              onClick={onClose}
                              className={`relative flex items-center gap-2.5 py-2 pr-3 pl-11 text-sm font-medium rounded-lg mx-1 my-0.5 transition-all duration-200 group ${
                                active
                                  ? "bg-white text-brand shadow-md shadow-black/10"
                                  : "text-white/65 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <span
                                className={`absolute left-4 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full transition-colors ${
                                  active ? "bg-brand" : "bg-white/25"
                                }`}
                              />
                              <ChildIcon
                                className={`w-4 h-4 shrink-0 ${
                                  active
                                    ? "text-brand"
                                    : "text-white/50 group-hover:text-white/80"
                                }`}
                              />
                              <span className="truncate">{child.label}</span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-bold text-sm">
              {(adminData?.name || currentUser.name).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {adminData?.name || currentUser.name}
              </p>
              <p className="text-xs text-white/60 capitalize">{userRole}</p>
            </div>
          </div>
          {userRole === "owner" && (
            <NavLink
              to="/settings"
              id="profile-tab"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors mb-2 ${
                  isActive
                    ? "bg-white text-primary"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`
              }
            >
              <Settings className="w-4 h-4" /> {t("sidebar.settings")}
            </NavLink>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors text-white/80 hover:text-white hover:bg-red-500/20"
          >
            <LogOut className="w-4 h-4" /> {t("sidebar.logout")}
          </button>
        </div>
      </div>
    </>
  );
};
