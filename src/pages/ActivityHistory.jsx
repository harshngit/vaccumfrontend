import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  History, Briefcase, Users, ShieldCheck, FileText,
  UserCog, User, Mail, RefreshCw, ChevronRight, Loader2,
  Search, Filter
} from "lucide-react";
import axios from "axios";
import { PageTransition, Card, SectionHeader, EmptyState, Button, useToast, Toast } from "../components/ui";

const API_BASE_URL = "https://vaccumapi-production.up.railway.app/api";

const TYPE_META = {
  job:           { icon: Briefcase,    color: "bg-blue-100    dark:bg-blue-900/30    text-blue-600    dark:text-blue-400"    },
  client:        { icon: Users,        color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
  amc:           { icon: ShieldCheck,  color: "bg-purple-100  dark:bg-purple-900/30  text-purple-600  dark:text-purple-400"  },
  report:        { icon: FileText,     color: "bg-gray-100    dark:bg-gray-700       text-gray-600    dark:text-gray-400"    },
  technician:    { icon: UserCog,      color: "bg-red-100     dark:bg-red-900/30     text-red-600     dark:text-red-400"     },
  user:          { icon: User,         color: "bg-indigo-100  dark:bg-indigo-900/30  text-indigo-600  dark:text-indigo-400"  },
  email_settings:{ icon: Mail,         color: "bg-cyan-100    dark:bg-cyan-900/30    text-cyan-600    dark:text-cyan-400"    },
};

const TYPE_FILTERS = ["All", "job", "client", "report", "technician", "amc", "user"];

export default function ActivityHistory() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination]   = useState(null);
  const [page, setPage]               = useState(1);
  const [typeFilter, setTypeFilter]   = useState("All");
  const [search, setSearch]           = useState("");

  useEffect(() => {
    setPage(1);
    setLogs([]);
    fetchLogs(1, true);
  }, [typeFilter]);

  const fetchLogs = async (pageNum = 1, reset = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const token  = localStorage.getItem("token");
      const params = { page: pageNum, limit: 30 };
      if (typeFilter !== "All") params.type = typeFilter;

      const res = await axios.get(`${API_BASE_URL}/activity`, {
        headers: { Authorization: `Bearer ${token}` }, params,
      });

      if (res.data.success) {
        const newLogs = res.data.data || [];
        setLogs(prev => reset ? newLogs : [...prev, ...newLogs]);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to fetch activity", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage);
  };

  // Client-side search filter on already-fetched logs
  const filtered = search.length > 1
    ? logs.filter(l =>
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        (l.entity_id || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.performed_by?.name || "").toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  // Navigate to entity detail page on row click
  const handleRowClick = (log) => {
    if (!log.entity_id || !log.entity_type) return;
    const paths = { job: `/jobs/${log.entity_id}`, report: `/reports/${log.entity_id}` };
    const path  = paths[log.entity_type];
    if (path) navigate(path);
  };

  const formatTime = (ts) => {
    if (!ts) return "—";
    try {
      return new Date(ts).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return ts;
    }
  };

  const hasMore = pagination && pagination.page < pagination.total_pages;

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <SectionHeader
          title="Activity History"
          subtitle={pagination ? `${pagination.total} total activities` : "Recent system activities"}
          action={
            <Button variant="secondary" onClick={() => { setPage(1); setLogs([]); fetchLogs(1, true); }}>
              <RefreshCw size={14} className="mr-1.5" /> Refresh
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 min-w-56 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search activities…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          {/* Type tabs */}
          <div className="flex gap-1 flex-wrap">
            {TYPE_FILTERS.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition
                  ${typeFilter === t ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-1/3 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={History} title="No activities found" description="No activity logs match your current filter." />
        ) : (
          <Card className="p-5">
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-700" />
              <div className="space-y-0">
                {filtered.map((log, i) => {
                  const meta = TYPE_META[log.type] || TYPE_META.report;
                  const Icon = meta.icon;
                  const isClickable = ["job", "report"].includes(log.entity_type);

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      onClick={() => handleRowClick(log)}
                      className={`flex gap-4 py-3.5 relative ${isClickable ? "cursor-pointer group" : ""}`}
                    >
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10 ${meta.color} ${isClickable ? "group-hover:scale-105 transition-transform" : ""}`}>
                        <Icon size={18} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-2">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                          {log.action}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {log.performed_by?.name && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                              {log.performed_by.name}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-400">{formatTime(log.performed_at)}</span>
                        </div>
                      </div>

                      {/* Type chip + link arrow */}
                      <div className="flex items-start gap-1.5 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold border ${
                          log.type === "job"       ? "border-blue-200    text-blue-600    bg-blue-50    dark:border-blue-800    dark:bg-blue-900/20    dark:text-blue-400"    :
                          log.type === "client"    ? "border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400" :
                          log.type === "report"    ? "border-gray-200    text-gray-500    bg-gray-50    dark:border-gray-700    dark:bg-gray-700       dark:text-gray-400"    :
                          log.type === "amc"       ? "border-purple-200  text-purple-600  bg-purple-50  dark:border-purple-800  dark:bg-purple-900/20  dark:text-purple-400"  :
                          log.type === "technician"? "border-red-200     text-red-600     bg-red-50     dark:border-red-800     dark:bg-red-900/20     dark:text-red-400"     :
                                                     "border-gray-200    text-gray-500    bg-gray-50    dark:border-gray-700    dark:bg-gray-700       dark:text-gray-400"
                        }`}>
                          {log.type}
                        </span>
                        {isClickable && (
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition mt-0.5" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Load more */}
        {!loading && hasMore && (
          <div className="mt-4 text-center">
            <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? <><Loader2 size={14} className="animate-spin mr-2" />Loading…</> : "Load More"}
            </Button>
          </div>
        )}

        {pagination && !loading && (
          <p className="text-center text-xs text-gray-400 mt-3">
            Showing {logs.length} of {pagination.total} activities
          </p>
        )}

        {toast && <Toast {...toast} onClose={() => {}} />}
      </div>
    </PageTransition>
  );
}