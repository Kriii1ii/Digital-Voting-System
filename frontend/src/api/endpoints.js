// src/api/endpoints.js
import api from "./api";
import axios from "axios";

const authConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});


const API_BASE = "http://localhost:5000/api"; // replace with your backend URL


// Register User
export const registerUser = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data; // return the JSON from backend
  } catch (error) {
    console.error("Error registering user:", error.response?.data || error.message);
    throw error;
  }
};

// Login User
export const loginUser = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    console.error("Login failed:", error.response?.data || error.message);
    throw error;
  }
};



// 👇 Add this new export
export const sendContactMessage = async (data) => {
  try {
    const response = await axios.post("http://localhost:5000/api/contact", data); // ✅ correct URL
    return response.data;
  } catch (error) {
    console.error("Error sending contact message:", error);
    throw error;
  }
};
// Example: Fetch candidates
export const getCandidates = async () => {
  try {
    const response = await api.get("/candidates");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    throw error;
  }
};
export const getAdminStats = async () => {
  try {
    const response = await api.get("/admin/stats");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch admin stats:", error.response?.data || error.message);
    throw error;
  }
};
export const getWinningCandidates = async () => {
  try {
    const response = await api.get("/admin/winners");  // adjust the path if needed
    return response.data;
  } catch (error) {
    console.error("Failed to fetch winning candidates:", error.response?.data || error.message);
    throw error;
  }
};
export const createPost = async (postData) => {
  try {
    const response = await api.post("/posts", postData); // Adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to create post:", error.response?.data || error.message);
    throw error;
  }
};

export const deletePost = async (postId) => {
  try {
    const response = await api.delete(`/posts/${postId}`); // adjust endpoint as needed
    return response.data;
  } catch (error) {
    console.error("Failed to delete post:", error.response?.data || error.message);
    throw error;
  }
};
export const getPosts = async () => {
  try {
    const response = await api.get("/posts"); // adjust the endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to fetch posts:", error.response?.data || error.message);
    throw error;
  }
};
// Reactions & comments (used by frontend to persist engagement so AI can pick it up)
export const addReaction = async (postId, reaction) => {
  try {
    const response = await api.post(`/posts/${postId}/reactions`, reaction);
    return response.data;
  } catch (error) {
    console.error('Failed to add reaction:', error.response?.data || error.message);
    throw error;
  }
};

export const addComment = async (postId, comment) => {
  try {
    const response = await api.post(`/posts/${postId}/comments`, comment);
    return response.data;
  } catch (error) {
    console.error('Failed to add comment:', error.response?.data || error.message);
    throw error;
  }
};
export const updatePost = async (postId, postData) => {
  try {
    const response = await api.put(`/posts/${postId}`, postData); // adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to update post:", error.response?.data || error.message);
    throw error;
  }
};
export const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await api.put(`/users/${userId}`, profileData); // adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to update user profile:", error.response?.data || error.message);
    throw error;
  }
};


// Create a new election
export const createElection = async (election, token) => {
  if (!token) throw new Error("No token found, login required");
  const response = await axios.post(
    `${API_BASE}/election/create`,
    election,
    authConfig(token)
  );
  return response.data.data.election;
};


// Get all elections
export const getElections = async () => {
  try {
    const response = await axios.get(`${API_BASE}/election`);
    // return only the elections array
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch elections:", error.response?.data || error.message);
    throw error;
  }
};

// Get single election by id
export const getElectionById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE}/election/${id}`);
    return response.data.data; // includes election + candidates
  } catch (error) {
    console.error("Failed to fetch election:", error.response?.data || error.message);
    throw error;
  }
};

// End an election immediately
export const endElection = async (id, token) => {
  const response = await axios.put(`${API_BASE}/election/${id}/end`, {}, authConfig(token));
  return response.data;
};




// Fetch prediction results from backend AI service for a given election
export const getPrediction = async (electionId) => {
  try {
    // Use public prediction endpoint so LivePoll can poll without admin auth
    const response = await api.get(`/prediction/public/${electionId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch prediction:", error.response?.data || error.message);
    throw error;
  }
};

export const getVotes = async () => {
  try {
    const response = await api.get("/votes"); // adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to fetch votes:", error.response?.data || error.message);

    throw error;
  }
};
export const addCandidate = async (candidateData) => {
  try {
    const response = await api.post("/candidates", candidateData); // adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to add candidate:", error.response?.data || error.message);
    throw error;
  }
};
export const updateCandidate = async (candidateId, candidateData) => {
  try {
    const response = await api.put(`/candidates/${candidateId}`, candidateData); // adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to update candidate:", error.response?.data || error.message);
    throw error;
  }
};
export const deleteCandidate = async (candidateId) => {
  try {
    const response = await api.delete(`/candidates/${candidateId}`); // adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to delete candidate:", error.response?.data || error.message);
    throw error;
  }
};
// --- VOTER API FUNCTIONS ---
// endpoints.js
export const getVoters = async (token) => {
  if (!token) throw new Error("No token provided");
  try {
    const response = await axios.get(`${API_BASE}/voters`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch voters:", error.response?.data || error.message);
    throw error;
  }
};


export const addVoter = (voterData, token) => {
  return axios.post(`${API_BASE}/voters`, voterData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// endpoints.js
export const updateVoter = async (id, updatedData, token) => {
  const res = await fetch(`/api/voters/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) throw new Error("Failed to update voter");
  return res.json();
};


export const deleteVoter = (voterId, token) => {
  return axios.delete(`${API_BASE}/voters/${voterId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


// endpoints.js
export const getVoterById = async (id, token) => {
  const res = await fetch(`/api/voters/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch voter");
  return res.json();
};
