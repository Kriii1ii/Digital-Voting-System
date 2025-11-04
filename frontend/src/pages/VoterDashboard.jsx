import React, { useState, createContext, useContext, useEffect } from "react";
import BiometricChoice from "../components/biometric/BiometricChoice";
import LivePoll from "../components/LivePoll";
import { useNavigate } from "react-router-dom";
import { Camera, LogOut, User, CheckCircle } from "lucide-react";
import { getPosts, getCandidates, addVoter, getVoterById } from "../api/endpoints"; // ✅ API imports

// --- AUTH CONTEXT ---
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const voterId = localStorage.getItem("voterId");

  useEffect(() => {
    if (!voterId) return;

    const fetchUser = async () => {
      try {
        const data = await getVoterById(voterId);
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch voter data:", err);
        setUser({});
      }
    };

    fetchUser();
  }, [voterId]);

  const updateBio = (newBio) => setUser((u) => ({ ...u, bio: newBio }));
  const updateProfilePic = (url) => setUser((u) => ({ ...u, profilePic: url }));

  if (!user) return <div className="text-center mt-20">Loading profile...</div>;

  return (
    <AuthContext.Provider value={{ user, updateBio, updateProfilePic }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- NAVBAR ---
const Navbar = ({ setPage }) => {
  const navigate = useNavigate();
  return (
    <nav className="bg-blue-50 text-black flex items-center justify-between px-6 py-5 shadow-md fixed w-full top-0 left-0 z-20">
      <div
        className="flex-1 flex justify-center items-center cursor-pointer"
        onClick={() => setPage("feed")}
      >
        <img src="/logo.png" alt="logo" className="h-16 w-auto object-contain cursor-pointer" />
      </div>
      <div className="flex items-center gap-5">
        <button onClick={() => setPage("feed")} className="px-5 py-2 rounded bg-blue-800 text-white hover:bg-blue-900">
          Feed
        </button>
        <button onClick={() => setPage("profile")} className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900">
          Profile
        </button>
        <button onClick={() => setPage("votenow")} className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900">
          Vote Now
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 flex items-center gap-1"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </nav>
  );
};

// --- FEED PAGE ---
const PostCard = ({ post, onReact, onComment, user }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [comment, setComment] = useState("");

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onComment(post.id, {
        userId: user.id,
        userName: user.fullName,
        userPic: user.profilePic,
        text: comment,
      });
      setComment("");
    }
  };

  const reactionsList = ["👍", "❤️", "😂", "😮", "😢", "😡"];
  const userReaction = post.reactions.find((r) => r.userId === user.id);
  const reactionSummary = {};
  post.reactions.forEach((r) => {
    reactionSummary[r.emoji] = (reactionSummary[r.emoji] || 0) + 1;
  });

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <img src={post.authorPic} alt="author" className="w-10 h-10 rounded-full object-cover border" />
        <div className="flex-1">
          <div className="font-semibold">{post.authorName}</div>
          <div className="text-xs text-gray-500">{post.time}</div>
        </div>
      </div>

      {post.text && <p className="mb-3 text-gray-800">{post.text}</p>}

      {post.media && post.media.type === "image" && (
        <img src={post.media.url} alt="post" className="w-full rounded-lg border mb-3" />
      )}
      {post.media && post.media.type === "video" && (
        <video src={post.media.url} controls className="w-full rounded-lg mb-3" />
      )}

      <div className="flex items-center gap-2 mb-2 relative">
        <button
          className="px-3 py-1 border rounded hover:bg-gray-200 transition flex items-center gap-1"
          onMouseEnter={() => setShowReactions(true)}
        >
          {userReaction ? userReaction.emoji : "👍"} Like {post.reactions.length > 0 && `(${post.reactions.length})`}
        </button>
        {showReactions && (
          <div
            className="absolute top-10 flex gap-2 bg-white border shadow rounded p-2 z-10"
            onMouseLeave={() => setShowReactions(false)}
          >
            {reactionsList.map((emoji) => (
              <span
                key={emoji}
                className="cursor-pointer text-xl transform hover:scale-125 transition"
                onClick={() => {
                  onReact(post.id, { userId: user.id, emoji });
                  setShowReactions(false);
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 mb-2">
        {Object.keys(reactionSummary).map((emoji) => (
          <span key={emoji} className="mr-2">
            {emoji} {reactionSummary[emoji]}
          </span>
        ))}
      </div>

      <div className="mt-2 space-y-2">
        {post.comments.map((c, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            {c.userPic ? (
              <img src={c.userPic} alt={c.userName} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <span className="font-semibold">{c.userName}: </span> {c.text}
            </div>
          </div>
        ))}
        <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Write a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 border px-2 py-1 rounded"
          />
          <button className="px-3 py-1 bg-blue-800 text-white rounded">Post</button>
        </form>
      </div>
    </div>
  );
};

const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts();
        setPosts(data);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    };
    fetchPosts();
  }, []);

  const handleReact = (postId, newReaction) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const existing = p.reactions.find((r) => r.userId === newReaction.userId);
          const updatedReactions = existing
            ? p.reactions.map((r) =>
                r.userId === newReaction.userId ? { ...r, emoji: newReaction.emoji } : r
              )
            : [...p.reactions, newReaction];
          return { ...p, reactions: updatedReactions };
        }
        return p;
      })
    );
  };

  const handleComment = (postId, commentObj) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, commentObj] } : p))
    );
  };

  if (!user) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-28 px-4">
      {/* Live poll preview for voters */}
      <LivePoll />

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onReact={handleReact} onComment={handleComment} user={user} />
      ))}
    </div>
  );
};

// --- PROFILE PAGE ---
const ProfilePage = () => {
  const { user, updateBio, updateProfilePic } = useAuth();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user.bio || "");

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateProfilePic(url);
  };

  const saveBio = () => {
    updateBio(bioText);
    setIsEditingBio(false);
    // Optional: call backend API to save bio
  };

  return (
    <div className="max-w-3xl mx-auto mt-28 px-4 space-y-8">
      <div className="bg-white rounded-xl shadow-lg border p-8 flex flex-col items-center text-center relative">
        <div className="relative">
          <div className="w-40 h-40 rounded-full border-4 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-100">
            {user.profilePic ? (
              <img src={user.profilePic} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500 text-sm font-medium">Profile</span>
            )}
          </div>
          <label className="absolute bottom-2 right-2 bg-gray-700 p-2 rounded-full cursor-pointer shadow-md hover:bg-gray-800 transition">
            <Camera className="w-5 h-5 text-white" />
            <input type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
          </label>
        </div>

        <h2 className="mt-4 text-2xl font-semibold text-gray-800">{user.fullName}</h2>
        <p className="text-gray-500">{user.email}</p>

        <div className="mt-4 w-full">
          {isEditingBio ? (
            <>
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-300"
                rows={3}
                placeholder="Write something about yourself..."
              />
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setIsEditingBio(false)} className="px-4 py-2 rounded border hover:bg-gray-100 transition">
                  Cancel
                </button>
                <button onClick={saveBio} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 transition">
                  Save
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={`text-gray-700 italic ${!user.bio ? "underline text-gray-400" : ""}`}>
                {user.bio || "No bio added yet"}
              </p>
              <button onClick={() => setIsEditingBio(true)} className="mt-2 text-sm text-gray-600 hover:underline">
                Edit Bio
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>
        <div className="flex flex-col gap-3 text-gray-700">
          <p><strong>Date of Birth:</strong> {user.dateOfBirth}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>ID Type:</strong> {user.idType}</p>
          <p><strong>ID Number:</strong> {user.idNumber}</p>
          <p><strong>Voter ID:</strong> {user.voterId}</p>
          <p><strong>Province:</strong> {user.province}</p>
          <p><strong>District:</strong> {user.district}</p>
          <p><strong>Ward:</strong> {user.ward}</p>
        </div>
      </div>
    </div>
  );
};

// --- VOTENOW PAGE ---
const VoteNowPage = () => {
  const { user } = useAuth();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voted, setVoted] = useState(false);
  const [candidates, setCandidates] = useState([]);
    const [pendingCandidate, setPendingCandidate] = useState(null);
    const [showVerifier, setShowVerifier] = useState(false);
    const [verifLoading, setVerifLoading] = useState(false);
    const [verifError, setVerifError] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const data = await getCandidates();
        setCandidates(data);
      } catch (err) {
        console.error("Failed to fetch candidates:", err);
      }
    };
    fetchCandidates();
  }, []);

  const handleVote = async (candidate) => {
    // Open biometric verifier before casting the vote
    setPendingCandidate(candidate);
    setVerifError(null);
    setShowVerifier(true);
  };

  const onVerificationComplete = async (responseData) => {
    // Called after BiometricChoice returns a successful verification
    try {
      setVerifLoading(true);
      setShowVerifier(false);
      if (!pendingCandidate) throw new Error('No candidate selected for vote');
      const effectiveUserId = (user && (user._id || user.id || user.voterId)) || localStorage.getItem('voterId');
      await addVoter({ userId: effectiveUserId, candidateId: pendingCandidate.id });
      setSelectedCandidate(pendingCandidate);
      setVoted(true);
      setPendingCandidate(null);
    } catch (err) {
      console.error('Voting failed after verification:', err);
      setVerifError(err.response?.data?.message || err.message || 'Vote failed.');
      // keep modal closed; let user retry voting
    } finally {
      setVerifLoading(false);
    }
  };

  if (!user) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-28 px-4">
      {!voted ? (
        <>
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6 text-center">
            Vote for Change <br />
            <span className="text-2xl font-bold text-blue-800 block mt-2">Select Your Representative</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-white border rounded-xl shadow-md p-5 flex flex-col items-center text-center hover:shadow-lg transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img src={candidate.photo || ""} alt={candidate.name} className="w-28 h-28 rounded-full object-cover border-2" />
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2">
                      <img src={candidate.sign || ""} alt={`${candidate.name} sign`} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-gray-600 text-sm mt-1">{candidate.signName || ""}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 text-lg mb-1">{candidate.name}</h3>
                <p className="text-gray-500 mb-2">{candidate.party}</p>
                <p className="text-gray-600 italic text-sm mt-1 mb-3">{candidate.bio}</p>
                <button onClick={() => handleVote(candidate)} className="px-5 py-2 bg-blue-800 text-white rounded hover:bg-blue-900 transition">
                  Vote
                </button>
              </div>
            ))}
          </div>
          {/* Biometric verification modal (shown when voter attempts to cast a vote) */}
          {showVerifier && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Face verification required</h3>
                  <button onClick={() => { setShowVerifier(false); setPendingCandidate(null); }} className="text-sm text-gray-600">Cancel</button>
                </div>
                <p className="text-sm text-gray-600 mb-4">Please verify your identity to submit this vote.</p>
                <BiometricChoice
                  userId={(user && (user._id || user.id || user.voterId)) || localStorage.getItem('voterId')}
                  mode="verification"
                  onCompletion={(data) => onVerificationComplete(data)}
                />
                {verifError && <div className="mt-3 text-sm text-red-600">{verifError}</div>}
              </div>
            </div>
          )}
        </>
      ) : (<div className="text-center bg-white p-10 rounded-xl shadow-lg">
          <CheckCircle size={48} className="text-green-600 mx-auto mb-3 animate-bounce" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Vote Submitted Successfully!</h2>
          <p className="text-gray-600">
            You voted for <strong className="text-blue-700">{selectedCandidate.name}</strong> from {selectedCandidate.party}.
          </p>
        </div>
      )}
    </div>
  );
};

// --- MAIN DASHBOARD ---
const VoterDashboard = () => {
  const [page, setPage] = useState("feed");

  return (
    <AuthProvider>
      <Navbar setPage={setPage} />
      {page === "feed" && <FeedPage />}
      {page === "profile" && <ProfilePage />}
      {page === "votenow" && <VoteNowPage />}
    </AuthProvider>
  );
};

export default VoterDashboard;