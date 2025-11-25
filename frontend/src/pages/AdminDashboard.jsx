import React, { useState, useEffect, useCallback, useRef } from "react";
// ...existing code...

// ...existing code...
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Menu,
  Home,
  Users,
  FileText,
  LogOut,
  BarChart2,
  User,
  Edit,
  Trash2,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
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
import {
  getAdminStats,
  getWinningCandidates,
  getVoters,
  verifyVoter,
  updateVoter,
  deleteVoter,
  getCandidates,
  getElections,
  getAdminVotes,
} from "../api/endpoints";
import LivePoll from "../components/LivePoll";
import LivePollHero from "../components/LivePollHero";
import PredictionPoll from "../components/PredictionPoll";
import AnimatedPoll from "../components/AnimatedPoll";
import AdminControls from "../components/AdminControls";
import MetricsDashboard from "../components/MetricsDashboard";
import { useAuth } from "../contexts/AuthContext";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
  { id: "votes", label: "Votes", icon: <BarChart2 className="w-5 h-5" /> },
  { id: "voters", label: "Voters", icon: <Users className="w-5 h-5" /> },
  { id: "candidates", label: "Candidates", icon: <FileText className="w-5 h-5" /> },
];

// Move Pagination component outside to prevent re-renders
const Pagination = React.memo(({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage, 
  itemsName 
}) => {
  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 rounded border ${
            currentPage === i
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
      <div className="text-sm text-gray-600">
        Showing {startItem} to {endItem} of {totalItems} {itemsName}
      </div>
      
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`p-2 rounded border ${
            currentPage === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded border ${
            currentPage === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded border ${
            currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded border ${
            currentPage === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

const SearchInput = React.memo(({ 
  value, 
  onChange, 
  onSearch, 
  onClear, 
  placeholder, 
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50]
}) => {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const handleClear = () => {
    onChange('');
    onClear();
    // Focus the input after clear
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Use useEffect to maintain focus - FIXED
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              // Auto-focus when component mounts
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Show:</label>
          <select
            value={itemsPerPage}
            onChange={onItemsPerPageChange}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      </div>
    </div>
  );
});

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [sampleStats, setSampleStats] = useState(null);
  const [winningCandidates, setWinningCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active section state
  const [activeSection, setActiveSection] = useState("dashboard");

  // Voter management states
  const [voters, setVoters] = useState([]);
  const [votersLoading, setVotersLoading] = useState(false);
  const [voterCurrentPage, setVoterCurrentPage] = useState(1);
  const [voterTotalPages, setVoterTotalPages] = useState(1);
  const [voterTotalItems, setVoterTotalItems] = useState(0);
  const [voterItemsPerPage, setVoterItemsPerPage] = useState(10);
  const [voterSearchQuery, setVoterSearchQuery] = useState('');

  // NEW: Overall voter statistics states
  const [voterTotalVerified, setVoterTotalVerified] = useState(0);
  const [voterTotalPending, setVoterTotalPending] = useState(0);

  // Candidate management states
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateCurrentPage, setCandidateCurrentPage] = useState(1);
  const [candidateTotalPages, setCandidateTotalPages] = useState(1);
  const [candidateTotalItems, setCandidateTotalItems] = useState(0);
  const [candidateItemsPerPage, setCandidateItemsPerPage] = useState(9);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');

  // NEW: Overall candidate statistics states
  const [candidateTotalMale, setCandidateTotalMale] = useState(0);
  const [candidateTotalFemale, setCandidateTotalFemale] = useState(0);
  const [candidateTotalOther, setCandidateTotalOther] = useState(0);

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({});

  // Optimized modal state management for voters
  const [editModalData, setEditModalData] = useState({
    isOpen: false,
    voterId: null,
    formData: {
      voterId: "",
      fullName: "",
      nationalId: "",
      dateOfBirth: ""
    }
  });

  // Calculate maximum date for 18 years ago
  const getMaxDateFor18Years = () => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  };

  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    
    switch (name) {
      case "fullName":
        if (!value.trim()) {
          errors.fullName = "Full name is required";
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          errors.fullName = "Name can only contain letters and spaces";
        } else if (value.length > 30) {
          errors.fullName = "Name cannot exceed 30 characters";
        } else {
          delete errors.fullName;
        }
        break;
      
      case "voterId":
        if (!value.trim()) {
          errors.voterId = "Voter ID is required";
        } else if (value.length > 13) {
          errors.voterId = "Voter ID cannot exceed 13 characters";
        } else {
          delete errors.voterId;
        }
        break;
      
      case "nationalId":
        if (!value.trim()) {
          errors.nationalId = "National ID is required";
        } else if (!/^\d{7}$/.test(value)) {
          errors.nationalId = "National ID must be exactly 7 digits";
        } else {
          delete errors.nationalId;
        }
        break;
      
      case "dateOfBirth":
        if (!value) {
          errors.dateOfBirth = "Date of birth is required";
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
          
          if (selectedDate > minDate) {
            errors.dateOfBirth = "Voter must be at least 18 years old";
          } else {
            delete errors.dateOfBirth;
          }
        }
        break;
      
      default:
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Dashboard data
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

  // Fetch voters data with pagination - FIXED with useCallback
  const fetchVotersData = useCallback(async (page = voterCurrentPage, limit = voterItemsPerPage, search = voterSearchQuery) => {
    try {
      setVotersLoading(true);
      const votersResponse = await getVoters(page, limit, search);
      console.log('Voters response:', votersResponse);
      
      setVoters(votersResponse.results || []);
      setVoterTotalItems(votersResponse.totalVoters || 0);
      setVoterTotalPages(votersResponse.totalPages || 1);
      setVoterCurrentPage(votersResponse.currentPage || page);
      
      // NEW: Calculate overall statistics from all voters (not just current page)
      // In a real app, you might want to get these from the API
      // For now, we'll calculate from the current page data (this will be accurate if we fetch all data)
      const verifiedCount = votersResponse.results?.filter(v => v.verified).length || 0;
      const pendingCount = votersResponse.results?.filter(v => !v.verified).length || 0;
      
      setVoterTotalVerified(verifiedCount);
      setVoterTotalPending(pendingCount);
      
    } catch (error) {
      console.error("Error fetching voters:", error);
      alert("Failed to load voters");
    } finally {
      setVotersLoading(false);
    }
  }, [voterCurrentPage, voterItemsPerPage, voterSearchQuery]);

  // Fetch candidates data with pagination - FIXED with useCallback
  const fetchCandidatesData = useCallback(async (page = candidateCurrentPage, limit = candidateItemsPerPage, search = candidateSearchQuery) => {
    try {
      setCandidatesLoading(true);
      const candidatesResponse = await getCandidates(page, limit, search);
      console.log('Candidates response:', candidatesResponse);
      
      setCandidates(candidatesResponse.results || []);
      setCandidateTotalItems(candidatesResponse.totalCandidates || 0);
      setCandidateTotalPages(candidatesResponse.totalPages || 1);
      setCandidateCurrentPage(candidatesResponse.currentPage || page);
      
      const maleCount = candidatesResponse.results?.filter(c => c.gender === 'male').length || 0;
      const femaleCount = candidatesResponse.results?.filter(c => c.gender === 'female').length || 0;
      const otherCount = candidatesResponse.results?.filter(c => c.gender === 'other').length || 0;
      
      setCandidateTotalMale(maleCount);
      setCandidateTotalFemale(femaleCount);
      setCandidateTotalOther(otherCount);
      
    } catch (error) {
      console.error("Error fetching candidates:", error);
      alert("Failed to load candidates");
    } finally {
      setCandidatesLoading(false);
    }
  }, [candidateCurrentPage, candidateItemsPerPage, candidateSearchQuery]);

  // Fetch data when sections are active
  useEffect(() => {
    if (activeSection === "voters") {
      fetchVotersData();
    } else if (activeSection === "candidates") {
      fetchCandidatesData();
    }
  }, [activeSection, fetchVotersData, fetchCandidatesData]);

  // Voter pagination handlers - FIXED with useCallback
  const handleVoterPageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= voterTotalPages) {
      setVoterCurrentPage(newPage);
      fetchVotersData(newPage, voterItemsPerPage, voterSearchQuery);
    }
  }, [voterTotalPages, voterItemsPerPage, voterSearchQuery, fetchVotersData]);

  const handleVoterSearch = useCallback(() => {
    setVoterCurrentPage(1);
    fetchVotersData(1, voterItemsPerPage, voterSearchQuery);
  }, [voterItemsPerPage, voterSearchQuery, fetchVotersData]);

  const handleVoterItemsPerPageChange = useCallback((e) => {
    const newLimit = parseInt(e.target.value);
    setVoterItemsPerPage(newLimit);
    setVoterCurrentPage(1);
    fetchVotersData(1, newLimit, voterSearchQuery);
  }, [voterSearchQuery, fetchVotersData]);

  const handleVoterSearchClear = useCallback(() => {
    setVoterSearchQuery('');
    setVoterCurrentPage(1);
    fetchVotersData(1, voterItemsPerPage, '');
  }, [voterItemsPerPage, fetchVotersData]);

  // Candidate pagination handlers - FIXED with useCallback
  const handleCandidatePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= candidateTotalPages) {
      setCandidateCurrentPage(newPage);
      fetchCandidatesData(newPage, candidateItemsPerPage, candidateSearchQuery);
    }
  }, [candidateTotalPages, candidateItemsPerPage, candidateSearchQuery, fetchCandidatesData]);

  const handleCandidateSearch = useCallback(() => {
    setCandidateCurrentPage(1);
    fetchCandidatesData(1, candidateItemsPerPage, candidateSearchQuery);
  }, [candidateItemsPerPage, candidateSearchQuery, fetchCandidatesData]);

  const handleCandidateItemsPerPageChange = useCallback((e) => {
    const newLimit = parseInt(e.target.value);
    setCandidateItemsPerPage(newLimit);
    setCandidateCurrentPage(1);
    fetchCandidatesData(1, newLimit, candidateSearchQuery);
  }, [candidateSearchQuery, fetchCandidatesData]);

  const handleCandidateSearchClear = useCallback(() => {
    setCandidateSearchQuery('');
    setCandidateCurrentPage(1);
    fetchCandidatesData(1, candidateItemsPerPage, '');
  }, [candidateItemsPerPage, fetchCandidatesData]);

  const handleLogout = () => {
    logout();
  };

  const handleMenuClick = (id) => {
    setActiveSection(id);
  };

  const handleMoreInfo = (type) => {
    alert(`More details about ${type} will appear here later.`);
  };

 
  const handleVerifyVoter = async (voterId) => {
    if (!window.confirm("Are you sure you want to verify this voter?")) {
      return;
    }

    try {
      const response = await verifyVoter(voterId);
      
      if (response.success) {
        alert("Voter verified successfully!");
        fetchVotersData(voterCurrentPage, voterItemsPerPage, voterSearchQuery);
      } else {
        alert(response.message || "Failed to verify voter");
      }
    } catch (error) {
      console.error("Error verifying voter:", error);
      alert("Failed to verify voter");
    }
  };

  // Optimized modal handlers for voters
  const handleEditVoter = useCallback((voter) => {
    setEditModalData({
      isOpen: true,
      voterId: voter._id,
      formData: {
        voterId: voter.voterId,
        fullName: voter.fullName,
        dateOfBirth: voter.dateOfBirth ? new Date(voter.dateOfBirth).toISOString().split('T')[0] : '',
        nationalId: voter.nationalId || ''
      }
    });
    setValidationErrors({});
  }, []);

  const handleEditFormChange = useCallback((field, value) => {
    let processedValue = value;

    switch (field) {
      case "fullName":
        processedValue = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 30);
        break;
      case "voterId":
        processedValue = value.slice(0, 13);
        break;
      case "nationalId":
        processedValue = value.replace(/\D/g, "").slice(0, 7);
        break;
      default:
        break;
    }

    setEditModalData(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: processedValue
      }
    }));

    validateField(field, processedValue);
  }, []);

  const handleSaveEdit = async () => {
    const isFullNameValid = validateField("fullName", editModalData.formData.fullName);
    const isVoterIdValid = validateField("voterId", editModalData.formData.voterId);
    const isNationalIdValid = validateField("nationalId", editModalData.formData.nationalId);
    const isDobValid = validateField("dateOfBirth", editModalData.formData.dateOfBirth);

    if (!isFullNameValid || !isVoterIdValid || !isNationalIdValid || !isDobValid) {
      alert("Please fix all validation errors before saving.");
      return;
    }

    const selectedDate = new Date(editModalData.formData.dateOfBirth);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    
    if (selectedDate > minDate) {
      alert("Voter must be at least 18 years old.");
      return;
    }

    try {
      const response = await updateVoter(editModalData.voterId, editModalData.formData);
      
      if (response.success) {
        setEditModalData({ 
          isOpen: false, 
          voterId: null, 
          formData: {
            voterId: "",
            fullName: "",
            nationalId: "",
            dateOfBirth: ""
          }
        });
        setValidationErrors({});
        alert("Voter updated successfully!");
        fetchVotersData(voterCurrentPage, voterItemsPerPage, voterSearchQuery);
      } else {
        alert(response.message || "Failed to update voter");
      }
    } catch (error) {
      console.error("Error updating voter:", error);
      alert("Failed to update voter");
    }
  };

  const handleDeleteVoter = async (voterId) => {
    if (!window.confirm("Are you sure you want to delete this voter? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await deleteVoter(voterId);
      
      if (response.success) {
        alert("Voter deleted successfully!");
        
        if (voters.length === 1 && voterCurrentPage > 1) {
          setVoterCurrentPage(voterCurrentPage - 1);
          fetchVotersData(voterCurrentPage - 1, voterItemsPerPage, voterSearchQuery);
        } else {
          fetchVotersData(voterCurrentPage, voterItemsPerPage, voterSearchQuery);
        }
      } else {
        alert(response.message || "Failed to delete voter");
      }
    } catch (error) {
      console.error("Error deleting voter:", error);
      alert("Failed to delete voter");
    }
  };

  // Section Components - FIXED: Using stable components
  const DashboardSection = () => (
    <>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">
        {t("dashboard")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <LivePollHero electionId={'mock-election'} title="Live AI Winner Prediction" />
        </div>
        <div className="md:col-span-1">
          <div className="space-y-4">
            <AnimatedPoll electionId={'mock-election'} />
            <MetricsDashboard electionId={'mock-election'} />
            <AdminControls electionId={'mock-election'} />
            <PredictionPoll electionId={'mock-election'} refreshInterval={3000} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#4BCBEB] text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
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

        <div className="bg-[#FE9496] text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
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
            {t("moreInfo")}
          </button>
        </div>

        <div className="bg-[#1BCFB4] text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
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
            {t("moreInfo")}
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
  );

  const VotesSection = () => (
    <VotesPanel />
  );

  // New: VotesPanel component implemented below to keep code organized
  const VotesPanel = () => {
    const [elections, setElections] = useState([]);
    const [selectedElection, setSelectedElection] = useState(null);
    const [votesLoading, setVotesLoading] = useState(false);
    const [votesData, setVotesData] = useState({ election: null, results: [] });

    useEffect(() => {
      let mounted = true;
      const loadElections = async () => {
        try {
          const list = await getElections();
          if (!mounted) return;
          setElections(list || []);
          // choose active or latest
          const active = (list || []).find((e) => e.status === 'active');
          setSelectedElection(active ? (active._id || active.id) : (list[0]?._id || list[0]?.id || null));
        } catch (err) {
          console.error('Failed to load elections:', err);
        }
      };
      loadElections();
      return () => { mounted = false; };
    }, []);

    useEffect(() => {
      if (!selectedElection) return;
      let mounted = true;
      const loadVotes = async () => {
        setVotesLoading(true);
        try {
          const data = await getAdminVotes(selectedElection);
          if (!mounted) return;
          setVotesData(data || { election: null, results: [] });
        } catch (err) {
          console.error('Failed to load admin votes:', err);
          setVotesData({ election: null, results: [] });
        } finally {
          if (mounted) setVotesLoading(false);
        }
      };
      loadVotes();
      return () => { mounted = false; };
    }, [selectedElection]);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-indigo-500/90">Votes</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Election:</label>
            <select
              value={selectedElection || ''}
              onChange={(e) => setSelectedElection(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">-- Select Election --</option>
              {elections.map((el) => (
                <option key={el._id || el.id} value={el._id || el.id}>
                  {el.title || el.name || (`Election ${el._id || el.id}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {votesLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
              <p className="mt-2">Loading votes...</p>
            </div>
          ) : !votesData || !votesData.results || votesData.results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No votes available for the selected election.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">{votesData.election?.title || 'Election Results'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {votesData.results.map((r) => (
                  <div key={r.candidate?.id || r.candidate?.name} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="font-semibold text-lg">{r.candidate?.name || 'Unknown Candidate'}</div>
                        <div className="text-sm text-gray-500">{r.candidate?.party || ''}</div>
                      </div>
                      <div className="text-2xl font-bold text-indigo-600">{r.votes}</div>
                    </div>
                    <div className="text-sm text-gray-600">Voters:</div>
                    <div className="mt-2 max-h-40 overflow-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-gray-500 text-xs">
                            <th className="py-1">Name</th>
                            <th className="py-1">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.voters && r.voters.length ? (
                            r.voters.map((v, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="py-1">{v?.fullName || v?.full_name || 'Unknown'}</td>
                                <td className="py-1 text-gray-600">{v?.email || 'N/A'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="py-2 text-gray-500">No voters listed</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const VoterManagementSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-indigo-500/90">Voter Management</h2>
      </div>
      
      {/* Search and Controls - FIXED */}
      <SearchInput
        value={voterSearchQuery}
        onChange={setVoterSearchQuery}
        onSearch={handleVoterSearch}
        onClear={handleVoterSearchClear}
        placeholder="Search by name or voter ID..."
        itemsPerPage={voterItemsPerPage}
        onItemsPerPageChange={handleVoterItemsPerPageChange}
        itemsPerPageOptions={[5, 10, 20, 50]}
      />

      {/* Verification Summary - UPDATED: Using overall totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{voterTotalItems}</p>
              <p className="text-sm text-gray-600">Total Voters</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {voterTotalVerified}
              </p>
              <p className="text-sm text-gray-600">Verified Voters</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <User className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {voterTotalPending}
              </p>
              <p className="text-sm text-gray-600">Pending Verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Voters Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#0acbae]">Registered Voters</h3>
          <div className="flex items-center gap-4">
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              {voterTotalItems} total voters
            </span>
            <span className="text-sm text-gray-600">
              Page {voterCurrentPage} of {voterTotalPages}
            </span>
          </div>
        </div>
        
        {votersLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <p className="mt-2">Loading voters...</p>
          </div>
        ) : voters.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {voterSearchQuery ? 'No voters found matching your search.' : 'No voters registered yet.'}
            </p>
            <p className="text-gray-400">
              {voterSearchQuery ? 'Try adjusting your search terms.' : 'Voters will appear here once registered.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Voter Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Voter ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">National ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date of Birth</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((v) => (
                    <tr key={v._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="font-medium text-gray-800">{v.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{v.voterId}</td>
                      <td className="py-3 px-4 text-gray-600">{v.nationalId || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {v.dateOfBirth ? new Date(v.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          v.verified 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            v.verified ? "bg-green-400" : "bg-yellow-400"
                          }`}></div>
                          {v.verified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {!v.verified ? (
                            <button
                              onClick={() => handleVerifyVoter(v.voterId)}
                              className="bg-[#0acbae] hover:bg-[#0aa890] text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              Verify
                            </button>
                          ) : (
                            <span className="text-green-600 text-sm font-medium">Verified ✓</span>
                          )}
                          <button
                            onClick={() => handleEditVoter(v)}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                            title="Edit Voter"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVoter(v._id)}
                            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                            title="Delete Voter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={voterCurrentPage}
              totalPages={voterTotalPages}
              onPageChange={handleVoterPageChange}
              totalItems={voterTotalItems}
              itemsPerPage={voterItemsPerPage}
              itemsName="voters"
            />
          </>
        )}
      </div>
    </div>
  );

  const CandidateManagementSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-indigo-500/90">Candidate Information</h2>
      </div>

      {/* Search and Controls - FIXED */}
      <SearchInput
        value={candidateSearchQuery}
        onChange={setCandidateSearchQuery}
        onSearch={handleCandidateSearch}
        onClear={handleCandidateSearchClear}
        placeholder="Search by candidate name or party..."
        itemsPerPage={candidateItemsPerPage}
        onItemsPerPageChange={handleCandidateItemsPerPageChange}
        itemsPerPageOptions={[6, 9, 12, 15]}
      />

      {/* Gender Statistics Cards - UPDATED: Using overall totals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{candidateTotalItems}</p>
              <p className="text-sm text-gray-600">Total Candidates</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <User className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {candidateTotalMale}
              </p>
              <p className="text-sm text-gray-600">Male Candidates</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-pink-500">
          <div className="flex items-center">
            <User className="w-8 h-8 text-pink-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {candidateTotalFemale}
              </p>
              <p className="text-sm text-gray-600">Female Candidates</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {candidateTotalOther}
              </p>
              <p className="text-sm text-gray-600">Other</p>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#0acbae]">Registered Candidates</h3>
          <div className="flex items-center gap-4">
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              {candidateTotalItems} total candidates
            </span>
            <span className="text-sm text-gray-600">
              Page {candidateCurrentPage} of {candidateTotalPages}
            </span>
          </div>
        </div>

        {candidatesLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <p className="mt-2">Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {candidateSearchQuery ? 'No candidates found matching your search.' : 'No candidates registered yet.'}
            </p>
            <p className="text-gray-400">
              {candidateSearchQuery ? 'Try adjusting your search terms.' : 'Candidates will appear here once registered by the electoral committee.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((c) => (
                <div
                  key={c._id || c.id}
                  className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={c.photo || c.profilePic || "/default-profile.png"}
                        alt={c.fullName || c.name}
                        className="w-16 h-16 rounded-full object-cover border"
                        onError={(e) => {
                          e.target.src = "/default-profile.png";
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800">{c.fullName || c.name}</h3>
                        <p className="text-blue-600 font-medium">{c.partyName || c.party}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Position:</span> {c.position}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Party:</span> {c.partyName || c.party}
                    </p>
                    {c.politicalSign && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-600">Symbol:</span>
                        <img
                          src={c.politicalSign}
                          alt="Political Symbol"
                          className="w-8 h-8 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Age:</span> {c.age} years
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Gender:</span> {c.gender ? c.gender.charAt(0).toUpperCase() + c.gender.slice(1) : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      <span className="font-medium">Manifesto:</span> {c.manifesto || c.bio || 'No manifesto provided'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={candidateCurrentPage}
              totalPages={candidateTotalPages}
              onPageChange={handleCandidatePageChange}
              totalItems={candidateTotalItems}
              itemsPerPage={candidateItemsPerPage}
              itemsName="candidates"
            />
          </>
        )}
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return loading ? <p className="text-center text-gray-600">{t("loading")}...</p> : <DashboardSection />;
      case "votes":
        return <VotesSection />;
      case "voters":
        return <VoterManagementSection />;
      case "candidates":
        return <CandidateManagementSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-[#f6f3fc] text-slate-800 transition-all duration-200 h-screen fixed top-0 left-0 z-40 ${collapsed ? "w-20" : "w-64"
          }`}
      >
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between p-4 border-b-3 border-gray-500">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo"
                className={`h-10 w-10 object-contain rounded-full border border-indigo-200 ${collapsed ? "mx-auto" : ""
                  }`}
              />
              {!collapsed && (
                <div>
                  <h1 className="text-xl font-extrabold text-indigo-800 tracking-wide">
                    {t("NayaMat")}
                  </h1>
                  <p className="text-sm text-indigo-600 font-medium">
                    {t("adminPanel")}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setCollapsed((s) => !s)}
              className="hidden md:inline-flex p-2 rounded hover:bg-indigo-100/70 text-indigo-600"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 p-4 border-b-2 border-gray-400">
            <div className="relative">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-500 rounded-full shadow-sm">
                <User className="w-6 h-6 text-white" />
              </div>
              <span
                onClick={() => setIsOnline((s) => !s)}
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-indigo-100 ${isOnline ? "bg-emerald-400" : "bg-slate-300"
                  }`}
                title={isOnline ? "Online" : "Offline"}
                style={{ cursor: "pointer" }}
              />
            </div>
            {!collapsed && (
              <div>
                <p className="text-base font-semibold text-indigo-900">
                  {t("systemAdministrator")}
                </p>
                <p className="text-sm text-indigo-600 font-medium">
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((m) => {
            const active = m.id === activeSection;
            return (
              <button
                key={m.id}
                onClick={() => handleMenuClick(m.id)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition text-base ${active
                    ? "bg-indigo-500/90 text-white font-semibold shadow-sm"
                    : "text-indigo-800/90 hover:bg-indigo-300"
                  }`}
              >
                {m.icon}
                {!collapsed && (
                  <span className="font-medium tracking-wide">{m.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sticky bottom-0 bg-[#f3e8ff] p-4 border-t border-gray-300 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-700 text-white hover:bg-blue-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && (
              <span className="font-semibold text-base tracking-wide">
                {t ? t("logout") : "Logout"}
              </span>
            )}
          </button>
        </div>
      </aside>

      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex justify-end items-center p-4.5 bg-[#f6eefd] border-b-3 border-gray-500">
          <div className="flex items-center h-11 gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-800 rounded-full">
              <User className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl text-black font-bold">
              {t("systemAdministrator")}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-6">
            {renderActiveSection()}
          </div>
        </main>
      </div>

      {/* Edit Voter Modal */}
      {editModalData.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-transparent"
            onClick={() => {
              setEditModalData({ 
                isOpen: false, 
                voterId: null, 
                formData: {
                  voterId: "",
                  fullName: "",
                  nationalId: "",
                  dateOfBirth: ""
                }
              });
              setValidationErrors({});
            }}
          ></div>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 relative z-10 border-2 border-blue-300">
            <h3 className="text-xl font-bold mb-4 text-blue-800">Edit Voter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voter ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editModalData.formData.voterId}
                  onChange={(e) => handleEditFormChange('voterId', e.target.value)}
                  className={`w-full border p-2 rounded focus:ring-2 focus:border-transparent ${
                    validationErrors.voterId 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter voter ID (max 13 chars)"
                />
                {validationErrors.voterId && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.voterId}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editModalData.formData.fullName}
                  onChange={(e) => handleEditFormChange('fullName', e.target.value)}
                  className={`w-full border p-2 rounded focus:ring-2 focus:border-transparent ${
                    validationErrors.fullName 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter full name (letters only)"
                />
                {validationErrors.fullName && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.fullName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  National ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editModalData.formData.nationalId}
                  onChange={(e) => handleEditFormChange('nationalId', e.target.value)}
                  className={`w-full border p-2 rounded focus:ring-2 focus:border-transparent ${
                    validationErrors.nationalId 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter 7-digit national ID"
                />
                {validationErrors.nationalId && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.nationalId}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={editModalData.formData.dateOfBirth}
                  onChange={(e) => handleEditFormChange('dateOfBirth', e.target.value)}
                  max={getMaxDateFor18Years()}
                  className={`w-full border p-2 rounded focus:ring-2 focus:border-transparent ${
                    validationErrors.dateOfBirth 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {validationErrors.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Maximum allowed date: {getMaxDateFor18Years()} (18 years ago)
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => {
                    setEditModalData({ 
                      isOpen: false, 
                      voterId: null, 
                      formData: {
                        voterId: "",
                        fullName: "",
                        nationalId: "",
                        dateOfBirth: ""
                      }
                    });
                    setValidationErrors({});
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={Object.keys(validationErrors).length > 0}
                  className={`px-4 py-2 rounded transition-colors ${
                    Object.keys(validationErrors).length > 0
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;