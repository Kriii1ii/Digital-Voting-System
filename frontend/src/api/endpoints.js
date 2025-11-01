// src/api/endpoints.js
import api from "./api";


// Contact Form
export const sendContactMessage = async (formData) => {
  try {
    const response = await api.post("/contact", formData); 
    return response.data;
  } catch (error) {
    console.error("Error sending contact message:", error.response?.data || error.message);
    throw error;
  }
};


// User Registration
export const registerUser = async (userData) => {
  try {
    const response = await api.post("routes/auth", userData); // ✅ your backend endpoint
    return response.data;
  } catch (error) {
    console.error("Error registering user:", error.response?.data || error.message);
    throw error;
  }
};


//login
export const loginUser = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error.response?.data || error.message);
    throw error;
  }
};

// Admin Dashboard Stats
export const getAdminStats = async () => {
  try {
    const response = await api.get("/admin/stats"); // backend will handle this route
    return response.data;
  } catch (error) {
    console.error("Error fetching admin stats:", error.response?.data || error.message);
    throw error;
  }
};

// Winning Candidates Data
export const getWinningCandidates = async () => {
  try {
    const response = await api.get("/admin/winning-candidates");
    return response.data;
  } catch (error) {
    console.error("Error fetching winning candidates:", error.response?.data || error.message);
    throw error;
  }
};


// add Candidate
export const addCandidate = async (candidateData) => {
  try {
    const response = await api.post("/candidates", candidateData);
    return response.data;
  } catch (error) {
    console.error("Error adding candidate:", error.response?.data || error.message);
    throw error;
  }
};

// add voter model
export const addVoter = async (voterData) => {
  try {
    const response = await api.post("/voters", voterData); // ✅ matches backend route
    return response.data;
  } catch (error) {
    console.error("Error adding voter:", error.response?.data || error.message);
    throw error;
  }
};




//candidate-dashboard

// Get all posts
export const getPosts = async () => {
  try {
    const response = await api.get("/posts");
    return response.data;
  } catch (error) {
    console.error("Error fetching posts:", error.response?.data || error.message);
    throw error;
  }
};

// Create a new post
export const createPost = async (postData) => {
  try {
    const response = await api.post("/posts", postData);
    return response.data;
  } catch (error) {
    console.error("Error creating post:", error.response?.data || error.message);
    throw error;
  }
};

// Update a post
export const updatePost = async (postId, postData) => {
  try {
    const response = await api.put(`/posts/${postId}`, postData);
    return response.data;
  } catch (error) {
    console.error("Error updating post:", error.response?.data || error.message);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId) => {
  try {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting post:", error.response?.data || error.message);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error.response?.data || error.message);
    throw error;
  }
};

//candidatelist
// GET /candidates
export const getCandidates = async () => {
  try {
    const response = await api.get("/candidates");
    return response.data; // array of candidates
  } catch (error) {
    console.error("Error fetching candidates:", error.response?.data || error.message);
    throw error;
  }
};
// PUT /candidates/:id
export const updateCandidate = async (id, candidateData) => {
  try {
    const formData = new FormData();
    formData.append("fullname", candidateData.fullname);
    formData.append("bio", candidateData.bio);
    if (candidateData.photo) formData.append("photo", candidateData.photo);

    const response = await api.put(`/candidates/${id}`, formData);
    return response.data; // updated candidate object
  } catch (error) {
    console.error("Error updating candidate:", error.response?.data || error.message);
    throw error;
  }
};
// DELETE /candidates/:id
export const deleteCandidate = async (id) => {
  try {
    const response = await api.delete(`/candidates/${id}`);
    return response.data; // usually success message or deleted id
  } catch (error) {
    console.error("Error deleting candidate:", error.response?.data || error.message);
    throw error;
  }
};

// Update Voter
export const updateVoter = async (id, updatedData) => {
  try {
    const response = await api.put(`/voters/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error updating voter:", error.response?.data || error.message);
    throw error;
  }
};

// Elections
export const getElections = async () => {
  try {
    const response = await api.get("/elections");
    return response.data; // array of elections
  } catch (error) {
    console.error("Error fetching elections:", error.response?.data || error.message);
    throw error;
  }
};

export const createElection = async (electionData) => {
  try {
    const response = await api.post("/elections", electionData);
    return response.data; // created election
  } catch (error) {
    console.error("Error creating election:", error.response?.data || error.message);
    throw error;
  }
};

export const updateElection = async (id, updatedData) => {
  try {
    const response = await api.put(`/elections/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error updating election:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteElection = async (id) => {
  try {
    const response = await api.delete(`/elections/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting election:", error.response?.data || error.message);
    throw error;
  }
};

//votes
// Get all votes
export const getVotes = async () => {
  try {
    const response = await api.get("/votes"); // make sure your backend endpoint is /votes
    return response.data; // should return an array of votes
  } catch (error) {
    console.error("Error fetching votes:", error.response?.data || error.message);
    throw error;
  }
};

//voterlist
// Get all voters
export const getVoters = async () => {
  try {
    const response = await api.get("/voters"); // Make sure this matches your backend route
    return response.data; // array of voters
  } catch (error) {
    console.error("Error fetching voters:", error.response?.data || error.message);
    throw error;
  }
};

// Delete a voter by ID
export const deleteVoter = async (id) => {
  try {
    const response = await api.delete(`/voters/${id}`); // matches your backend DELETE /voters/:id
    return response.data;
  } catch (error) {
    console.error("Error deleting voter:", error.response?.data || error.message);
    throw error;
  }
};

