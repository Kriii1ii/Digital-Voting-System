import React, { useState, useEffect, useCallback } from "react";
import {
    LogOut,
    Home,
    Users,
    UserCheck,
    BarChart2,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import EditCandidateModal from "./component/EditCandidateModal";

import {
    getCandidates,
    getElections,
    createElection,
    getVoters,
    updateElection,
    deleteElection,
    addCandidateElectoral,
    updateCandidate,
    deleteCandidate
} from "../../api/endpoints";

// Import sections
import DashboardSection from "./sections/DashboardSection";
import VotersSection from "./sections/VotersSection";
import CandidatesSection from "./sections/CandidatesSection";
import ElectionsSection from "./sections/ElectionsSection";

const ElectoralCommitteeDashboard = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();

    const [activeSection, setActiveSection] = useState("dashboard");
    const [elections, setElections] = useState([]);
    const [newElection, setNewElection] = useState({ title: "", startDate: "", endDate: "" });

    // Voter states
    const [voters, setVoters] = useState([]);
    const [voterCurrentPage, setVoterCurrentPage] = useState(1);
    const [voterTotalPages, setVoterTotalPages] = useState(1);
    const [voterTotalItems, setVoterTotalItems] = useState(0);
    const [voterItemsPerPage, setVoterItemsPerPage] = useState(10);
    const [voterSearchQuery, setVoterSearchQuery] = useState('');
    const [votersLoading, setVotersLoading] = useState(false);

    // Candidate states
    const [candidates, setCandidates] = useState([]);
    const [candidateCurrentPage, setCandidateCurrentPage] = useState(1);
    const [candidateTotalPages, setCandidateTotalPages] = useState(1);
    const [candidateTotalItems, setCandidateTotalItems] = useState(0);
    const [candidateItemsPerPage, setCandidateItemsPerPage] = useState(9);
    const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
    const [candidatesLoading, setCandidatesLoading] = useState(false);

    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editedDates, setEditedDates] = useState({ startDate: "", endDate: "" });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Candidate Registration Form States
    const [showCandidateForm, setShowCandidateForm] = useState(false);
    const [candidateFormData, setCandidateFormData] = useState({
        fullName: "", email: "", password: "", age: "", gender: "", partyName: "",
        position: "Mayor", manifesto: "", photo: "", politicalSign: ""
    });
    const [formErrors, setFormErrors] = useState({});
    const [candidateLoading, setCandidateLoading] = useState(false);

    // Edit Candidate Modal States
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [editFormData, setEditFormData] = useState({
        fullName: "", email: "", password: "", age: "", gender: "", partyName: "",
        position: "Mayor", manifesto: "", photo: "", politicalSign: ""
    });
    const [editFormErrors, setEditFormErrors] = useState({});
    const [editLoading, setEditLoading] = useState(false);
    const [updatingCandidateId, setUpdatingCandidateId] = useState(null);
    const [deletingCandidateId, setDeletingCandidateId] = useState(null);

    const positions = ["Mayor"];

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
        { id: "voters", label: "Voters", icon: <Users className="w-5 h-5" /> },
        { id: "candidates", label: "Candidates", icon: <UserCheck className="w-5 h-5" /> },
        { id: "elections", label: "Elections", icon: <BarChart2 className="w-5 h-5" /> },
    ];

    useEffect(() => {
        console.log('Current user:', user);
        console.log('User role:', user?.role);
    }, [user]);

    // Fetch elections
    const fetchElectionsData = async () => {
        try {
            const electionsResponse = await getElections();
            const electionsData = electionsResponse.data || electionsResponse || [];
            setElections(Array.isArray(electionsData) ? electionsData : []);
        } catch (error) {
            console.error("Error fetching elections:", error);
            setElections([]);
        }
    };

    // Fetch voters with pagination
    const fetchVotersData = useCallback(async (page = voterCurrentPage, limit = voterItemsPerPage, search = voterSearchQuery) => {
        try {
            setVotersLoading(true);
            const votersResponse = await getVoters(page, limit, search);
            console.log('Voters response:', votersResponse);

            setVoters(votersResponse.results || votersResponse.data || []);
            setVoterTotalItems(votersResponse.totalVoters || votersResponse.total || 0);
            setVoterTotalPages(votersResponse.totalPages || 1);
            setVoterCurrentPage(votersResponse.currentPage || page);

        } catch (error) {
            console.error("Error fetching voters:", error);
        } finally {
            setVotersLoading(false);
        }
    }, [voterCurrentPage, voterItemsPerPage, voterSearchQuery]);

    // Fetch candidates with pagination
    const fetchCandidatesData = useCallback(async (page = candidateCurrentPage, limit = candidateItemsPerPage, search = candidateSearchQuery) => {
        try {
            setCandidatesLoading(true);
            const candidatesResponse = await getCandidates(page, limit, search);
            console.log('Candidates response:', candidatesResponse);

            const candidatesArray = candidatesResponse.results || candidatesResponse.data || candidatesResponse || [];
            setCandidates(Array.isArray(candidatesArray) ? candidatesArray : []);
            setCandidateTotalItems(candidatesResponse.totalCandidates || candidatesResponse.total || 0);
            setCandidateTotalPages(candidatesResponse.totalPages || 1);
            setCandidateCurrentPage(candidatesResponse.currentPage || page);

        } catch (error) {
            console.error("Error fetching candidates:", error);
        } finally {
            setCandidatesLoading(false);
        }
    }, [candidateCurrentPage, candidateItemsPerPage, candidateSearchQuery]);

    // Voter pagination handlers
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

    // Candidate pagination handlers
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchElectionsData();
                if (activeSection === "voters") {
                    await fetchVotersData();
                } else if (activeSection === "candidates") {
                    await fetchCandidatesData();
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [activeSection, fetchVotersData, fetchCandidatesData]);

    // Function to calculate end date
    const calculateEndDate = (startDate) => {
        if (!startDate) return '';
        const date = new Date(startDate);
        date.setDate(date.getDate() + 3);
        return date.toISOString().split('T')[0];
    };

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const image = reader.result;
            const { name } = e.target;
            setCandidateFormData(prev => ({ ...prev, [name]: image }));
        };
        reader.readAsDataURL(file);
    };

    const handleEditFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const image = reader.result;
            const { name } = e.target;
            setEditFormData(prev => ({ ...prev, [name]: image }));
        };
        reader.readAsDataURL(file);
    };

    // Candidate Form Handlers
    const handleCandidateInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "fullName") {
            const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 30);
            setCandidateFormData(prev => ({ ...prev, [name]: lettersOnly }));
        } else if (name === "password") {
            setCandidateFormData(prev => ({ ...prev, [name]: value.slice(0, 30) }));
        } else if (name === "partyName") {
            const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 15);
            setCandidateFormData(prev => ({ ...prev, [name]: lettersOnly }));
        } else if (name === "email") {
            setCandidateFormData(prev => ({ ...prev, [name]: value.slice(0, 40) }));
        } else if (name === "age") {
            const numbersOnly = value.replace(/[^0-9]/g, "").slice(0, 2);
            setCandidateFormData(prev => ({ ...prev, [name]: numbersOnly }));
        } else if (name === "manifesto") {
            setCandidateFormData(prev => ({ ...prev, [name]: value.slice(0, 150) }));
        } else {
            setCandidateFormData(prev => ({ ...prev, [name]: value }));
        }

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "fullName") {
            const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 30);
            setEditFormData(prev => ({ ...prev, [name]: lettersOnly }));
        } else if (name === "password") {
            setEditFormData(prev => ({ ...prev, [name]: value.slice(0, 30) }));
        } else if (name === "partyName") {
            const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 15);
            setEditFormData(prev => ({ ...prev, [name]: lettersOnly }));
        } else if (name === "email") {
            setEditFormData(prev => ({ ...prev, [name]: value.slice(0, 40) }));
        } else if (name === "age") {
            const numbersOnly = value.replace(/[^0-9]/g, "").slice(0, 2);

            if (numbersOnly === "") {
                setEditFormData(prev => ({ ...prev, [name]: "" }));
            } else {
                const age = parseInt(numbersOnly, 10);

                if (numbersOnly.length === 1 || age >= 21) {
                    setEditFormData(prev => ({ ...prev, [name]: numbersOnly }));
                }
            }
        } else if (name === "manifesto") {
            setEditFormData(prev => ({ ...prev, [name]: value.slice(0, 150) }));
        } else {
            setEditFormData(prev => ({ ...prev, [name]: value }));
        }

        if (editFormErrors[name]) {
            setEditFormErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateCandidateForm = () => {
        const errors = {};

        if (!candidateFormData.fullName.trim()) errors.fullName = "Full name is required";
        if (!candidateFormData.email.trim()) errors.email = "Email is required";
        else if (!candidateFormData.email.includes("@")) errors.email = "Invalid email address";
        if (!candidateFormData.password) errors.password = "Password is required";
        else if (candidateFormData.password.length < 6) errors.password = "Password must be at least 6 characters";
        if (!candidateFormData.age) errors.age = "Age is required";
        else if (candidateFormData.age < 21 || candidateFormData.age > 100) errors.age = "Age must be between 21 and 100";
        if (!candidateFormData.gender) errors.gender = "Gender is required";
        if (!candidateFormData.partyName.trim()) errors.partyName = "Party name is required";
        if (!candidateFormData.position) errors.position = "Position is required";
        if (!candidateFormData.manifesto.trim()) errors.manifesto = "Manifesto is required";
        if (!candidateFormData.photo) errors.photo = "Photo is required";
        if (!candidateFormData.politicalSign) errors.politicalSign = "Political Sign is required";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateEditForm = () => {
        const errors = {};

        if (!editFormData.fullName.trim()) errors.fullName = "Full name is required";
        if (!editFormData.email.trim()) errors.email = "Email is required";
        else if (!editFormData.email.includes("@")) errors.email = "Invalid email address";
        if (!editFormData.password) errors.password = "Password is required";
        else if (editFormData.password.length < 6) errors.password = "Password must be at least 6 characters";
        if (!editFormData.age) errors.age = "Age is required";
        else if (editFormData.age < 21 || editFormData.age > 100) errors.age = "Age must be between 21 and 100";
        if (!editFormData.gender) errors.gender = "Gender is required";
        if (!editFormData.partyName.trim()) errors.partyName = "Party name is required";
        if (!editFormData.position) errors.position = "Position is required";
        if (!editFormData.manifesto.trim()) errors.manifesto = "Manifesto is required";

        setEditFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCandidateSubmit = async (e) => {
        e.preventDefault();

        const ageNum = parseInt(candidateFormData.age, 10);

        if (isNaN(ageNum) || ageNum < 21) {
            setFormErrors(prev => ({
                ...prev,
                age: "Age must be 21 or above",
            }));
            return;
        }

        if (!validateCandidateForm()) return;

        setCandidateLoading(true);
        try {
            const candidatePayload = {
                fullName: candidateFormData.fullName,
                email: candidateFormData.email,
                password: candidateFormData.password,
                age: parseInt(candidateFormData.age),
                gender: candidateFormData.gender,
                partyName: candidateFormData.partyName,
                position: candidateFormData.position,
                manifesto: candidateFormData.manifesto,
                photo: candidateFormData.photo,
                politicalSign: candidateFormData.politicalSign
            };

            console.log('Creating candidate:', candidatePayload);

            const response = await addCandidateElectoral(candidatePayload);

            if (response.success || response.data) {
                setCandidateFormData({
                    fullName: "", email: "", password: "", age: "", gender: "", partyName: "",
                    position: "", manifesto: "", photo: "", politicalSign: ""
                });
                setFormErrors({});
                setShowCandidateForm(false);
                await fetchCandidatesData();
                alert("Candidate registered successfully!");
            } else {
                alert(response.message || "Failed to register candidate");
            }
        } catch (error) {
            console.error("Error registering candidate:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to register candidate";
            alert(`Error: ${errorMessage}`);
        } finally {
            setCandidateLoading(false);
        }
    };

    // Edit Candidate Functions
    const handleEditCandidate = (candidate) => {
        setEditingCandidate(candidate);
        setEditFormData({
            fullName: candidate.fullName || "",
            email: candidate.email || "",
            password: candidate.password || "",
            age: candidate.age || "",
            gender: candidate.gender || "",
            partyName: candidate.partyName || "",
            position: candidate.position || "Mayor",
            manifesto: candidate.manifesto || "",
            photo: candidate.photo || "",
            politicalSign: candidate.politicalSign || ""
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!validateEditForm()) return;

        setEditLoading(true);
        setUpdatingCandidateId(editingCandidate._id);
        try {
            const candidatePayload = {
                fullName: editFormData.fullName,
                email: editFormData.email,
                password: editFormData.password,
                age: parseInt(editFormData.age),
                gender: editFormData.gender,
                partyName: editFormData.partyName,
                position: editFormData.position,
                manifesto: editFormData.manifesto,
                photo: editFormData.photo,
                politicalSign: editFormData.politicalSign
            };

            console.log('Updating candidate:', candidatePayload);

            const response = await updateCandidate(editingCandidate._id, candidatePayload);
            console.log('Update response:', response);

            let updatedCandidate;
            if (response.data) {
                updatedCandidate = response.data;
            } else if (response.candidate) {
                updatedCandidate = response.candidate;
            } else if (response.success) {
                updatedCandidate = { ...candidatePayload, _id: editingCandidate._id };
            } else {
                updatedCandidate = { ...candidatePayload, _id: editingCandidate._id };
            }

            setCandidates(prevCandidates =>
                prevCandidates.map(candidate =>
                    candidate._id === editingCandidate._id
                        ? { ...candidate, ...updatedCandidate }
                        : candidate
                )
            );

            if (selectedCandidate && selectedCandidate._id === editingCandidate._id) {
                setSelectedCandidate(prev => ({ ...prev, ...updatedCandidate }));
            }

            setShowEditModal(false);
            setEditingCandidate(null);
            setEditFormData({
                fullName: "", email: "", password: "", age: "", gender: "", partyName: "",
                position: "", manifesto: "", photo: "", politicalSign: ""
            });
            setEditFormErrors({});

            alert("Candidate updated successfully!");

        } catch (error) {
            console.error("Error updating candidate:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to update candidate";
            alert(`Error: ${errorMessage}`);
        } finally {
            setEditLoading(false);
            setUpdatingCandidateId(null);
        }
    };

    const handleDeleteCandidate = async (candidateId) => {
        if (!window.confirm("Are you sure you want to delete this candidate? This action cannot be undone.")) {
            return;
        }

        setDeletingCandidateId(candidateId);
        try {
            setCandidates(prevCandidates =>
                prevCandidates.filter(candidate => candidate._id !== candidateId)
            );

            if (selectedCandidate && selectedCandidate._id === candidateId) {
                setSelectedCandidate(null);
            }

            const response = await deleteCandidate(candidateId);

            if (!response.success) {
                await fetchCandidatesData();
                alert(response.message || "Failed to delete candidate");
            } else {
                alert("Candidate deleted successfully!");
            }
        } catch (error) {
            await fetchCandidatesData();
            console.error("Error deleting candidate:", error);
            alert("Failed to delete candidate");
        } finally {
            setDeletingCandidateId(null);
        }
    };

    // Handle election form changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "startDate") {
            const endDate = calculateEndDate(value);
            setNewElection({
                ...newElection,
                startDate: value,
                endDate: endDate
            });
        } else {
            setNewElection({
                ...newElection,
                [name]: value
            });
        }
    };

    // Handle edited dates changes
    const handleEditedDatesChange = (field, value) => {
        if (field === "startDate") {
            const endDate = calculateEndDate(value);
            setEditedDates({
                startDate: value,
                endDate: endDate
            });
        } else {
            setEditedDates(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    // Create election function
    const handleCreateElection = async () => {
        console.log('Creating election with data:', newElection);

        if (!newElection.title || !newElection.startDate || !newElection.endDate) {
            alert("Please fill all fields");
            return;
        }

        if (!["admin", "electoral_committee"].includes(user?.role)) {
            alert("Only admins or committee members can create elections");
            return;
        }

        if (new Date(newElection.endDate) <= new Date(newElection.startDate)) {
            alert("End date must be after start date");
            return;
        }

        try {
            const electionPayload = {
                title: newElection.title,
                startDate: newElection.startDate,
                endDate: newElection.endDate,
                description: `Election for ${newElection.title}`,
                candidates: [],
                eligibleVoterIds: []
            };

            console.log('Sending election payload:', electionPayload);

            const response = await createElection(electionPayload);
            console.log('Create election response:', response);

            if (response.success || response.data) {
                setNewElection({ title: "", startDate: "", endDate: "" });
                await fetchElectionsData();
                alert("Election created successfully!");
            } else {
                alert(response.message || "Failed to create election");
            }
        } catch (error) {
            console.error("Error creating election:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to create election";
            alert(`Error: ${errorMessage}`);
        }
    };

    // DELETE election
    const handleDeleteElection = async (electionId) => {
        if (!window.confirm("Are you sure you want to DELETE this election? This action cannot be undone.")) {
            return;
        }

        setLoading(true);
        try {
            const response = await deleteElection(electionId);

            if (response.success) {
                setElections(prevElections =>
                    prevElections.filter(election => election._id !== electionId)
                );
                alert("Election deleted successfully!");
            } else {
                alert(response.message || "Failed to delete election");
                await fetchElectionsData();
            }
        } catch (error) {
            console.error("Error deleting election:", error);
            alert("Failed to delete election");
            await fetchElectionsData();
        } finally {
            setLoading(false);
        }
    };

    // Update election
    const handleUpdateElection = async (electionId) => {
        if (!editedDates.startDate) {
            alert("Please fill start date");
            return;
        }

        const endDate = calculateEndDate(editedDates.startDate);

        try {
            const response = await updateElection(
                electionId,
                { startDate: editedDates.startDate, endDate: endDate }
            );

            if (response.success) {
                setEditingId(null);
                setEditedDates({ startDate: "", endDate: "" });
                await fetchElectionsData();
                alert("Election updated successfully!");
            } else {
                alert(response.message || "Failed to update election");
            }
        } catch (error) {
            console.error("Error updating election:", error);
            alert("Failed to update election");
        }
    };

    const handleLogout = () => {
        logout();
    };

    const handleBack = () => setSelectedCandidate(null);

    const handleCandidateClick = (candidate) => {
        setSelectedCandidate(candidate);
    };

    const renderActiveSection = () => {
        const sectionProps = {
            // Dashboard props
            elections, newElection, editingId, editedDates,
            handleChange, handleCreateElection, handleEditedDatesChange,
            handleUpdateElection, handleDeleteElection, setEditingId,
            setEditedDates, calculateEndDate,

            // Voters props
            voters, voterCurrentPage, voterTotalPages, voterTotalItems, voterItemsPerPage,
            voterSearchQuery, votersLoading, handleVoterPageChange, handleVoterSearch,
            handleVoterItemsPerPageChange, handleVoterSearchClear, setVoterSearchQuery,

            // Candidates props
            candidates, candidateCurrentPage, candidateTotalPages, candidateTotalItems,
            candidateItemsPerPage, candidateSearchQuery, candidatesLoading, selectedCandidate,
            showCandidateForm, candidateFormData, formErrors, candidateLoading,
            updatingCandidateId, deletingCandidateId, positions, showPassword,
            handleCandidatePageChange, handleCandidateSearch, handleCandidateItemsPerPageChange,
            handleCandidateSearchClear, setCandidateSearchQuery, setShowCandidateForm,
            handleCandidateInputChange, handleFile, handleCandidateSubmit, setShowPassword,
            handleCandidateClick, handleBack, handleEditCandidate, handleDeleteCandidate,

            // Common props
            setShowEditModal, setEditingCandidate, setEditFormData
        };

        switch (activeSection) {
            case "dashboard":
                return <DashboardSection {...sectionProps} />;
            case "voters":
                return <VotersSection {...sectionProps} />;
            case "candidates":
                return <CandidatesSection {...sectionProps} />;
            case "elections":
                return <ElectionsSection
                    elections={elections}
                    editingId={editingId}
                    editedDates={editedDates}
                    handleEditedDatesChange={handleEditedDatesChange}
                    handleUpdateElection={handleUpdateElection}
                    handleDeleteElection={handleDeleteElection}
                    setEditingId={setEditingId}
                    setEditedDates={setEditedDates}  // Explicitly pass this
                    calculateEndDate={calculateEndDate}
                />;
            default:
                return <DashboardSection {...sectionProps} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-[#f0e7ed] shadow-sm flex justify-center items-center px-6 py-4 fixed top-0 left-0 right-0 z-10">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="logo" className="h-18 w-auto object-contain" />
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-800 to-blue-400 text-transparent bg-clip-text tracking-wide">
                        Electoral Committee Dashboard
                    </h1>
                </div>
            </header>

            <div className="flex flex-1 mt-20">
                {/* Sidebar */}
                <aside className="w-64 bg-[#f1e8ff] shadow-md flex flex-col fixed left-0 top-20 bottom-0 text-slate-800">
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {menuItems.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    setActiveSection(section.id);
                                    setSelectedCandidate(null);
                                    setShowCandidateForm(false);
                                }}
                                className={`flex items-center gap-3 w-full text-left px-3 py-2 mt-4 rounded-lg transition-all ${activeSection === section.id
                                    ? "bg-indigo-500/90 text-white font-semibold shadow-sm"
                                    : "text-indigo-800/90 hover:bg-indigo-300"
                                    }`}
                            >
                                {section.icon}
                                <span className="font-medium tracking-wide text-base">
                                    {section.label}
                                </span>
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-300 bg-[#f3e8ff]">
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-700 text-white hover:bg-blue-800 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="font-semibold text-base tracking-wide">Logout</span>
                        </button>
                    </div>
                </aside>

                <main className="flex-1 p-8 overflow-auto ml-64">
                    {renderActiveSection()}
                </main>
            </div>

            {/* Edit Candidate Modal */}
            {showEditModal && (
                <EditCandidateModal
                    showEditModal={showEditModal}
                    setShowEditModal={setShowEditModal}
                    editingCandidate={editingCandidate}
                    editFormData={editFormData}
                    editFormErrors={editFormErrors}
                    editLoading={editLoading}
                    showPassword={showPassword}
                    positions={positions}
                    handleEditInputChange={handleEditInputChange}
                    handleEditFile={handleEditFile}
                    handleEditSubmit={handleEditSubmit}
                    setShowPassword={setShowPassword}
                />
            )}
        </div>
    );
};

export default ElectoralCommitteeDashboard;