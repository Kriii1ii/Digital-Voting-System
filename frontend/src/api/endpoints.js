// src/api/endpoints.js
import api from "./api";

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
export const sendContactMessage = async (messageData) => {
  try {
    const response = await api.post("/contact", messageData);
    return response.data;
  } catch (error) {
    console.error("Error sending contact message:", error.response?.data || error.message);
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
export const addVoter = async (voterData) => {
  try {
    const response = await api.post("/voters", voterData); // adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to add voter:", error.response?.data || error.message);
    throw error;
  }
};
export const createElection = async (electionData) => {
  try {
    const response = await api.post("/elections", electionData); // adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to create election:", error.response?.data || error.message);
    throw error;
  }
};
export const getElections = async () => {
  try {
    const response = await api.get("/elections"); // adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to fetch elections:", error.response?.data || error.message);
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
export const updateVoter = async (voterId, voterData) => {
  try {
    const response = await api.put(`/voters/${voterId}`, voterData); // adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to update voter:", error.response?.data || error.message);
    throw error;
  }
};
export const deleteVoter = async (voterId) => {
  try {
    const response = await api.delete(`/voters/${voterId}`); // adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to delete voter:", error.response?.data || error.message);
    throw error;
  }
};
export const getVoters = async () => {
  try {
    const response = await api.get("/voters"); // adjust endpoint if needed
    return response.data;
  } catch (error) {
    console.error("Failed to fetch voters:", error.response?.data || error.message);
    throw error;
  }
};
export const getVoterById = async (id) => {
  const res = await API.get(`/voter/${id}`);
  return res.data.data; // the voter object
};