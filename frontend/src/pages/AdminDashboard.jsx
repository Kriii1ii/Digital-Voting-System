import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Menu,
  Home,
  Users,
  FileText,
  LogOut,
  BarChart2,
  User,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { getAdminStats, getWinningCandidates } from "../api/endpoints";
import LivePoll from "../components/LivePoll";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
  { id: "votes", label: "Votes", icon: <BarChart2 className="w-5 h-5" /> },
  { id: "voters", label: "Voters", icon: <Users className="w-5 h-5" /> },
  { id: "candidates", label: "Candidates", icon: <FileText className="w-5 h-5" /> },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isOnline, setIsOnline] = useState(true);

  const [sampleStats, setSampleStats] = useState(null);
  const [winningCandidates, setWinningCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [stats, winners] = await Promise.all([
          getAdminStats(),
          getWinningCandidates(),
        ]);
        setSampleStats(stats);
        setWinningCandidates(winners);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleMenuClick = (id) => {
    setActiveMenu(id);
    if (id === "votes") navigate("/admin-dashboard/votes");
    else if (id === "voters") navigate("/admin-dashboard/voters");
    else if (id === "candidates") navigate("/admin-dashboard/candidates");
    else navigate("/admin-dashboard");
  };

  const handleMoreInfo = (type) => {
    alert(`More details about ${type} will appear here later.`);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={`flex flex-col bg-slate-900 text-white transition-all duration-200 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className={`h-10 w-10 object-contain rounded ${
                collapsed ? "mx-auto" : ""
              }`}
            />
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold">{t("NayaMat")}</h1>
                <p className="text-xs text-slate-300">{t("adminPanel")}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed((s) => !s)}
            className="hidden md:inline-flex p-2 rounded hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <div className="relative">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-800 rounded-full">
              <User className="w-6 h-6 text-white" />
            </div>
            <span
              onClick={() => setIsOnline((s) => !s)}
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-slate-900 ${
                isOnline ? "bg-green-400" : "bg-gray-400"
              }`}
              title={isOnline ? "Online" : "Offline"}
              style={{ cursor: "pointer" }}
            />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold">{t("systemAdministrator")}</p>
              <p className="text-xs text-slate-300">
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2 overflow-auto">
          {menuItems.map((m) => {
            const active = m.id === activeMenu;
            return (
              <button
                key={m.id}
                onClick={() => handleMenuClick(m.id)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-slate-800 transition ${
                  active
                    ? "bg-gradient-to-r from-sky-700 to-sky-600 font-semibold"
                    : "font-medium"
                }`}
              >
                {m.icon}
                {!collapsed && <span>{m.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 bg-blue-800 text-white hover:bg-blue-900 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="font-semibold">{t("logout")}</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex justify-end items-center p-4 bg-slate-800 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-800 rounded-full">
              <User className="w-6 h-6 text-white" />
            </div>
            <p className="text-lg text-white font-bold">
              {t("systemAdministrator")}
            </p>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {activeMenu === "dashboard" ? (
            loading ? (
              <p className="text-center text-gray-600">{t("loading")}...</p>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-slate-800 mb-6">
                  {t("dashboard")}
                </h1>

                <div className="max-w-4xl mx-auto mb-6">
                  <LivePoll />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-green-700 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                    <div>
                      <h2 className="text-4xl font-extrabold">
                        {sampleStats?.candidates ?? 0}
                      </h2>
                      <p className="text-sm mt-2 opacity-90">
                        {t("total")} {t("candidates")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMoreInfo("candidates")}
                      className="mt-4 self-start text-white border border-white/50 rounded-lg py-1.5 px-4 text-sm hover:bg-white/20"
                    >
                      {t("moreInfo")}
                    </button>
                  </div>

                  <div className="bg-blue-800 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                    <div>
                      <h2 className="text-4xl font-extrabold">
                        {sampleStats?.totalVoters ?? 0}
                      </h2>
                      <p className="text-sm mt-2 opacity-90">
                        {t("total")} {t("voters")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMoreInfo("voters")}
                      className="mt-4 self-start text-white border border-white/50 rounded-lg py-1.5 px-4 text-sm hover:bg-white/20"
                    >
                      {t("moreinfo")}
                    </button>
                  </div>

                  <div className="bg-pink-600 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                    <div>
                      <h2 className="text-4xl font-extrabold">
                        {sampleStats?.voted ?? 0}
                      </h2>
                      <p className="text-sm mt-2 opacity-90">
                        {t("voters")} {t("voted")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMoreInfo("voted")}
                      className="mt-4 self-start text-white border border-white/50 rounded-lg py-1.5 px-4 text-sm hover:bg-white/20"
                    >
                      {t("moreinfo")}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-slate-700 mb-4">
                    Winning Candidates (Mayor)
                  </h2>
                  <Bar
                    data={{
                      labels: winningCandidates.map((c) => c.name),
                      datasets: [
                        {
                          label: "Votes",
                          data: winningCandidates.map((c) => c.votes),
                          backgroundColor: ["#2563eb", "#16a34a", "#f59e0b"],
                          borderRadius: 6,
                        },
                      ],
                    }}
                  />
                </div>
              </>
            )
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
