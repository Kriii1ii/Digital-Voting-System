//voterdashboard
import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  LogOut,
  User,
  CheckCircle,
  ArrowLeft,
  Trash2,
  Heart,
  MessageCircle,
  Share,
  ThumbsUp,
  Laugh,
  Mail,
  Calendar,
  FileText,
  Edit,
  MoreVertical
} from "lucide-react";
import {
  getPosts,
  getCandidates,
  addReaction,
  addComment,
  editComment,
  deleteComment,
  getElections,
  updateUserProfile,
  uploadProfileImage,
  castVote
} from "../api/endpoints";
import { useAuth } from "../contexts/AuthContext";
import PredictionPoll from "../components/PredictionPoll";
import AnimatedPoll from "../components/AnimatedPoll";
import { candidateNameMap } from '../utils/candidateNameMap';

// NAVBAR 
const Navbar = ({ setPage }) => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleNavigation = (pageName) => {
    console.log("Navigating to:", pageName);
    setPage(pageName);
  };

  return (
    <nav className="bg-blue-50 text-black flex items-center justify-between px-6 py-5 shadow-md fixed w-full top-0 left-0 z-50">
      <div
        className="flex-1 flex justify-center items-center cursor-pointer"
        onClick={() => handleNavigation("feed")}
      >
        <img src="/logo.png" alt="logo" className="h-16 w-auto object-contain cursor-pointer" />
      </div>
      <div className="flex items-center gap-5">
        <button
          onClick={() => handleNavigation("feed")}
          className="px-5 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 transition"
        >
          Feed
        </button>
        <button
          onClick={() => handleNavigation("profile")}
          className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 transition"
        >
          Profile
        </button>
        <button
          onClick={() => handleNavigation("votenow")}
          className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 transition"
        >
          Vote Now
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 transition flex items-center gap-1"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

// REACTION TYPES 
const REACTION_TYPES = [
  { type: "like", emoji: "👍", label: "Like", icon: ThumbsUp, color: "text-blue-600" },
  { type: "love", emoji: "❤️", label: "Love", icon: Heart, color: "text-red-600" },
  { type: "haha", emoji: "😂", label: "Haha", icon: Laugh, color: "text-yellow-600" },
  { type: "wow", emoji: "😮", label: "Wow", color: "text-yellow-600" },
  { type: "sad", emoji: "😢", label: "Sad", color: "text-yellow-600" },
  { type: "angry", emoji: "😡", label: "Angry", color: "text-red-600" }
];

// POST CARD 
const PostCard = ({ post, onReact, onComment, onEditComment, onDeleteComment, user }) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState("");
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState(post.reactions || []);
  const [localComments, setLocalComments] = useState(post.comments || []);
  const [showAllComments, setShowAllComments] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [showCommentMenu, setShowCommentMenu] = useState(null);
  const reactionTimerRef = useRef(null);

  // Check if current user has already reacted
  const userReaction = localReactions.find((r) => r.user_id === user?.id);

  const reactionSummary = {};
  localReactions.forEach((r) => {
    reactionSummary[r.type] = (reactionSummary[r.type] || 0) + 1;
  });

  const totalReactions = localReactions.length;

  // Get display reaction for current user
  const getCurrentUserReaction = () => {
    if (!userReaction) return null;
    return REACTION_TYPES.find(r => r.type === userReaction.type);
  };

  const currentUserReaction = getCurrentUserReaction();

  const commentsToDisplay = showAllComments ? localComments : localComments.slice(0, 5);

  const hasMoreComments = localComments.length > 5;

  const handleReactionSelect = async (reactionType) => {
    try {
      // If user already reacted with this type, remove reaction
      if (userReaction?.type === reactionType) {
        const updatedReactions = localReactions.filter(r => r.user_id !== user.id);
        setLocalReactions(updatedReactions);
      } else {
        // Replace existing reaction or add new one
        const filteredReactions = localReactions.filter(r => r.user_id !== user.id);
        const newReaction = {
          user_id: user.id,
          type: reactionType,
          user: {
            fullName: user.fullName,
            profilePic: user.profilePicture
          }
        };
        setLocalReactions([...filteredReactions, newReaction]);
      }

      setShowReactionPicker(false);

      await onReact(post._id, { user_id: user.id, type: reactionType });
    } catch (error) {
      console.error("Failed to add reaction:", error);
      setLocalReactions(post.reactions || []);
    }
  };

  const handleReactionButtonClick = () => {
    if (currentUserReaction) {
      // If already reacted, remove reaction on click
      handleReactionSelect(currentUserReaction.type);
    } else {
      setShowReactionPicker(true);
    }
  };

  const handleMouseEnterReaction = () => {
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
    }
    setShowReactionPicker(true);
  };

  const handleMouseLeaveReaction = () => {
    reactionTimerRef.current = setTimeout(() => {
      setShowReactionPicker(false);
    }, 500);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const newComment = {
        user_id: user.id,
        text: comment,
        user: {
          fullName: user.fullName,
          profilePic: user.profilePicture
        },
        timestamp: new Date().toISOString()
      };

      // Update local state immediately
      setLocalComments(prev => [...prev, newComment]);
      setComment("");
      setShowCommentInput(false);

      await onComment(post._id, newComment);
    } catch (error) {
      console.error("Failed to add comment:", error);
      setLocalComments(prev => prev.filter(c => c.text !== comment));
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentText(comment.text);
    setShowCommentMenu(null);
  };

  const handleSaveEdit = async (commentId) => {
    try {
      if (!editCommentText.trim()) return;

      // Update local state immediately
      setLocalComments(prev =>
        prev.map(comment =>
          comment._id === commentId
            ? { ...comment, text: editCommentText }
            : comment
        )
      );

      await onEditComment(commentId, { text: editCommentText });

      setEditingCommentId(null);
      setEditCommentText("");
    } catch (error) {
      console.error("Failed to edit comment:", error);
      setLocalComments(post.comments || []);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText("");
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        // Remove from local state immediately
        setLocalComments(prev => prev.filter(comment => comment._id !== commentId));

        await onDeleteComment(commentId, user.id);
        setShowCommentMenu(null);
      } catch (error) {
        console.error("Failed to delete comment:", error);
        setLocalComments(post.comments || []);
      }
    }
  };

  // Get author information with fallbacks
  const getAuthorInfo = () => {
    if (post.author) {
      return {
        name: post.author.fullName || "Unknown User",
        photo: post.author.photo,
      };
    }
    return {
      name: "Unknown User",
      pic: "/defaultPP.jpg",
      role: "user"
    };
  };

  const authorInfo = getAuthorInfo();

  // Get top reactions for display
  const getTopReactions = () => {
    const counts = {};
    localReactions.forEach(r => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => REACTION_TYPES.find(r => r.type === type)?.emoji)
      .filter(Boolean);
  };

  const topReactions = getTopReactions();

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <img
          src={authorInfo.photo || "/defaultPP.jpg"}
          alt="author"
          className="w-10 h-10 rounded-full object-cover border"
          onError={(e) => {
            e.target.src = "/default-avatar.png";
          }}
        />
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-2">
            {authorInfo.name}
            {authorInfo.role === 'candidate' && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Candidate</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Recent"}
          </div>
        </div>
      </div>

      {post.text && <p className="mb-3 text-gray-800 whitespace-pre-wrap">{post.text}</p>}

      {post.media?.url && post.media.type === "image" && (
        <img
          src={post.media.url}
          alt="post"
          className="w-full rounded-lg border mb-3 max-h-96 object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}

      {post.media?.url && post.media.type === "video" && (
        <video
          src={post.media.url}
          controls
          className="w-full rounded-lg border mb-3 max-h-96"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}

      {/* Reaction and Comment Stats */}
      {(totalReactions > 0 || localComments.length > 0) && (
        <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-100 pb-2 mb-2">
          <div className="flex items-center gap-2">
            {totalReactions > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {topReactions.map((emoji, index) => (
                    <span key={index} className="text-xs bg-white rounded-full border border-white -ml-1 first:ml-0">
                      {emoji}
                    </span>
                  ))}
                </div>
                <span>{totalReactions}</span>
              </div>
            )}
          </div>
          {localComments.length > 0 && (
            <span>{localComments.length} comments</span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center border-t border-gray-100 pt-2">
        <div
          className="relative flex-1"
          onMouseEnter={handleMouseEnterReaction}
          onMouseLeave={handleMouseLeaveReaction}
        >
          <button
            onClick={handleReactionButtonClick}
            className={`flex items-center justify-center gap-2 px-2 py-2 rounded-lg transition w-full ${currentUserReaction
              ? `${currentUserReaction.color} font-semibold`
              : "hover:bg-gray-100 text-gray-600"
              }`}
          >
            {currentUserReaction ? (
              <>
                <span className="text-lg">{currentUserReaction.emoji}</span>
                <span>{currentUserReaction.label}</span>
              </>
            ) : (
              <>
                <ThumbsUp size={18} />
                <span>Like</span>
              </>
            )}
          </button>

          {/* Reaction Picker */}
          {showReactionPicker && (
            <div
              className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg p-2 flex gap-1"
              onMouseEnter={handleMouseEnterReaction}
              onMouseLeave={handleMouseLeaveReaction}
            >
              {REACTION_TYPES.map((reaction) => (
                <button
                  key={reaction.type}
                  className={`transform transition-transform hover:scale-125 text-2xl p-1 rounded-full ${userReaction?.type === reaction.type ? 'scale-110 bg-gray-100' : ''
                    }`}
                  onClick={() => handleReactionSelect(reaction.type)}
                  title={reaction.label}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowCommentInput(!showCommentInput)}
          className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
        >
          <MessageCircle size={18} />
          <span>Comment</span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="mt-4 space-y-3">
        {commentsToDisplay.map((comment, index) => (
          <div key={comment._id || index} className="flex items-start gap-3 group">
            <div className="flex-shrink-0">
              {comment.user?.profilePic ? (
                <img
                  src={comment.user.profilePic}
                  alt={comment.user?.fullName}
                  className="w-8 h-8 rounded-full object-cover border"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              )}
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-3 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{comment.user?.fullName || "User"}</div>

                  {editingCommentId === comment._id ? (
                    <div className="mt-2">
                      <textarea
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows="2"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(comment._id)}
                          disabled={!editCommentText.trim()}
                          className="px-3 py-1 text-sm bg-blue-800 text-white rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-700 mt-1">{comment.text}</div>
                  )}

                  <div className="text-xs text-gray-500 mt-1">
                    {comment.timestamp ? new Date(comment.timestamp).toLocaleTimeString() : "Now"}
                  </div>
                </div>

                {/* Edit/Delete Menu */}
                {comment.user_id === user?.id && !editingCommentId && (
                  <div className="relative">
                    <button
                      onClick={() => setShowCommentMenu(showCommentMenu === comment._id ? null : comment._id)}
                      className="p-1 rounded-full hover:bg-gray-200 transition opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {showCommentMenu === comment._id && (
                      <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Show more/less comments button */}
        {hasMoreComments && (
          <div className="text-center">
            <button
              onClick={() => setShowAllComments(!showAllComments)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition px-4 py-2 rounded-lg hover:bg-blue-50"
            >
              {showAllComments ? 'Show fewer comments' : `View all ${localComments.length} comments`}
            </button>
          </div>
        )}

        {showCommentInput && (
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-3">
            <div className="flex-shrink-0">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="You"
                  className="w-8 h-8 rounded-full object-cover border"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCommentInput(false)}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!comment.trim()}
                  className="px-4 py-1 bg-blue-800 text-white rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Comment
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// FEED PAGE 
const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load posts from backend
  const loadPosts = async () => {
    try {
      setRefreshing(true);

      const res = await getPosts();
      // Handle different response shapes: {data: [...]}, {results: [...]}, or direct array
      const raw = res?.data || res?.results || res || [];
      console.log("Fetched posts from backend:", raw);

      // Ensure we have an array and properly initialize reactions and comments
      const postsWithInteractions = Array.isArray(raw)
        ? raw.map((post) => ({
            ...post,
            reactions: Array.isArray(post.reactions) ? post.reactions : [],
            comments: Array.isArray(post.comments) ? post.comments : [],
          }))
        : [];

      setPosts(postsWithInteractions);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleReact = async (postId, reaction) => {
    try {
      console.log("Adding reaction:", { postId, reaction });

      // Optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            // Remove existing reaction from this user if any
            const filteredReactions = post.reactions.filter(
              (r) => r.user_id !== reaction.user_id
            );
            // Add new reaction
            return {
              ...post,
              reactions: [...filteredReactions, reaction],
            };
          }
          return post;
        })
      );

      // Send to backend - pass the entire reaction object which includes type
      const response = await addReaction(postId, reaction);
      console.log("Reaction response:", response);

      await loadPosts();
    } catch (err) {
      console.error("Failed to add reaction:", err);
      await loadPosts();
    }
  };

  const handleComment = async (postId, comment) => {
    try {
      console.log("Adding comment:", { postId, comment });

      const response = await addComment(postId, comment);
      console.log("Comment response:", response);
      await loadPosts();
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert("Failed to add comment. Please try again.");
    }
  };

  const handleEditComment = async (commentId, commentData) => {
    try {
      console.log("Editing comment:", { commentId, commentData });

      const response = await editComment(commentId, commentData);
      console.log("Edit comment response:", response);
      await loadPosts();
    } catch (err) {
      console.error("Failed to edit comment:", err);
      alert("Failed to edit comment. Please try again.");
    }
  };

  const handleDeleteComment = async (commentId, userId) => {
    try {
      console.log("Deleting comment:", { commentId, userId });
      const response = await deleteComment(commentId, userId);
      console.log("Delete comment response:", response);
      await loadPosts();
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert("Failed to delete comment. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-28 px-4">
        <div className="text-center text-gray-500">Please wait...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-28 px-4">
      <div className="flex gap-6">
        <div className="flex-1 max-w-3xl">
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border border-gray-300">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user?.fullName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
          ) : (
            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-800 font-semibold text-lg">
                {user?.fullName?.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-800">
            Welcome, {user?.fullName}
          </h1>
        </div>
      </div>

        </div>

        <aside className="w-96 shrink-0">
          <div className="sticky top-28 space-y-4">
            {/* Animated chart: trends */}
            <div>
              <AnimatedPoll electionId={'mock-election'} />
            </div>

            {/* Prediction summary below */}
            <div>
              <PredictionPoll electionId={'mock-election'} refreshInterval={3000} />
            </div>
          </div>
        </aside>
      </div>

      {postsLoading ? (
        <div className="text-center text-gray-500 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mx-auto mb-2"></div>
          Loading posts from candidates...
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 py-8 bg-white rounded-lg border border-gray-200">
          <p className="text-lg mb-2">No posts available yet</p>
          <p className="text-sm text-gray-600">
            Candidates haven't posted anything recently.
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onReact={handleReact}
            onComment={handleComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            user={user}
          />
        ))
      )}
    </div>
  );
};


// PROFILE PAGE 
const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.bio) {
      setBioText(user.bio);
    }
  }, [user]);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const image = reader.result;
      console.log("Base64:", image);
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, WebP)");
        return;
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Please select an image smaller than 2MB");
        return;
      }

      setUploading(true);

      try {
        const response = await uploadProfileImage(user.id, image);

        if (response.success) {
          localStorage.setItem('user', JSON.stringify({ ...response.data, id: response.data._id }))
          updateUser(response.data)
          alert("Profile picture updated successfully!");
        }
        else {
          alert('Failed to update profile picture')
        }

      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try another one.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveProfilePic = async () => {
    if (window.confirm("Are you sure you want to remove your profile picture?")) {
      try {
        const response = await updateUserProfile(user.id, { ...user, profilePicture: "/defaultPP.jpg" });
        console.log(response.data)
        // Update user context
        if (response.data) {
          localStorage.setItem('user', JSON.stringify({ ...user, profilePicture: "/defaultPP.jpg" }))
          updateUser({ ...user, profilePicture: "/defaultPP.jpg" });
        }

        alert("Profile picture removed successfully!");
      } catch (error) {
        console.error("Error removing profile picture:", error);
        alert("Failed to remove profile picture");
      }
    }
  };

  const saveBio = async () => {
    try {
      const response = await updateUserProfile(user.id, { bio: bioText });

      if (response.data) {
        updateUser({ bio: bioText });
      }

      setIsEditingBio(false);
      alert("Bio updated successfully!");
    } catch (error) {
      console.error("Error updating bio:", error);
      alert("Failed to update bio");
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto mt-28 px-4">
        <div className="text-center text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-28 px-4 space-y-8">
      <div className="bg-white rounded-xl shadow-lg border p-8 flex flex-col items-center text-center relative">
        <div className="relative">
          <div className="w-40 h-40 rounded-full border-4 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-100 relative">
            {uploading && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
              </div>
            )}

            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                  updateUser({ profilePicture: "/default-avatar.png" });
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          <label className={`absolute bottom-2 right-2 p-2 rounded-full cursor-pointer shadow-md transition ${uploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleProfilePicChange}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {user.profilePicture && !uploading && (
            <button
              onClick={handleRemoveProfilePic}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"
              title="Remove profile picture"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <h2 className="mt-4 text-2xl font-semibold text-gray-800">{user.fullName} ({user.role})</h2>
        <p className="text-gray-500">{user.email}</p>

        {uploading && (
          <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Uploading...
          </div>
        )}

      </div>

      <div className="bg-white rounded-xl shadow-lg border p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div><strong>Full Name:</strong> {user.fullName}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Date of Birth:</strong> {user.dateOfBirth || "N/A"}</div>
          <div><strong>Phone:</strong> {user.phone || "N/A"}</div>
          <div><strong>ID Type:</strong> {user.idType || "N/A"}</div>
          <div><strong>ID Number:</strong> {user.idNumber || "N/A"}</div>
          <div><strong>Voter ID:</strong> {user.voterId || "N/A"}</div>
          <div><strong>Province:</strong> {user.province || "N/A"}</div>
          <div><strong>District:</strong> {user.district || "N/A"}</div>
          <div><strong>Ward:</strong> {user.ward || "N/A"}</div>
        </div>
      </div>
    </div>
  );
};

// VOTENOW PAGE 
const VoteNowPage = () => {
  const { user } = useAuth();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voted, setVoted] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [pendingCandidate, setPendingCandidate] = useState(null);
  const [showVerifier, setShowVerifier] = useState(false);
  const [verifLoading, setVerifLoading] = useState(false);
  const [verifError, setVerifError] = useState(null);
  const [elections, setElections] = useState([]);
  const [showCandidateDetail, setShowCandidateDetail] = useState(false);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Check if user has already voted
  useEffect(() => {
    const checkVoteStatus = () => {
      const userVoteStatus = localStorage.getItem(`hasVoted_${user?.id}`);
      if (userVoteStatus === 'true') {
        setHasVoted(true);
        setVoted(true);
      }
    };
    
    checkVoteStatus();
  }, [user]);

  // Fetch candidates and elections
  useEffect(() => {
    const fetchData = async () => {
      try {
        setCandidatesLoading(true);
        setFetchError(null);
        
        console.log("Fetching candidates and elections...");
        
        const [candidatesData, electionsData] = await Promise.all([
          getCandidates(),
          getElections()
        ]);
        
        console.log("Candidates response:", candidatesData);
        console.log("Elections response:", electionsData);

        // Handle different response structures
        const candidatesArray = candidatesData.results || candidatesData.data || candidatesData || [];
        const electionsArray = electionsData.results || electionsData.data || electionsData || [];

        setCandidates(Array.isArray(candidatesArray) ? candidatesArray : []);
        setElections(Array.isArray(electionsArray) ? electionsArray : []);

        console.log("Processed candidates:", candidatesArray);
        console.log("Processed elections:", electionsArray);

      } catch (err) {
        console.error("Failed to fetch data:", err);
        setFetchError("Failed to load candidates. Please try again later.");
        setCandidates([]);
        setElections([]);
      } finally {
        setCandidatesLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleViewDetails = (candidate) => {
    setSelectedCandidateDetail(candidate);
    setShowCandidateDetail(true);
  };

  const handleVote = (candidate) => {
    if (hasVoted) {
      alert("You have already voted. You can only vote once.");
      return;
    }

    if (elections.length === 0) {
      alert("No active elections found. Please try again later.");
      return;
    }

    console.log("Vote button clicked for:", candidate.fullName);
    setPendingCandidate(candidate);
    setVerifError(null);
    setShowVerifier(true);
  };

  const onVerificationComplete = async () => {
    try {
      setVerifLoading(true);
      setShowVerifier(false);

      if (!pendingCandidate) {
        throw new Error("No candidate selected for vote");
      }

      if (!elections[0]?._id) {
        throw new Error("No active election found");
      }

      console.log("Voting for candidate:", pendingCandidate._id);
      console.log("In election:", elections[0]._id);

      const voteResponse = await castVote({
        electionId: elections[0]._id,
        candidateId: pendingCandidate._id,
        voterId: user.voterId || user.VoterId

      });

      console.log("Vote response:", voteResponse);

      if (voteResponse.success) {
        setSelectedCandidate(pendingCandidate);
        setVoted(true);
        setHasVoted(true);
        setShowCandidateDetail(false);
        localStorage.setItem(`hasVoted_${user?.id}`, 'true');
        setPendingCandidate(null);
        
        alert("Vote cast successfully! Thank you for participating.");
      } else {
        throw new Error(voteResponse.message || "Failed to cast vote");
      }
    } catch (err) {
      console.error("Voting failed:", err);
      setVerifError(err.message || "Vote failed. Please try again.");
    } finally {
      setVerifLoading(false);
    }
  };

  const handleBackToList = () => {
    setShowCandidateDetail(false);
    setSelectedCandidateDetail(null);
  };

  // Show success message after voting
  if (voted) {
    return (
      <div className="max-w-4xl mx-auto mt-28 px-4">
        <div className="text-center bg-white p-10 rounded-xl shadow-lg border border-green-200">
          <CheckCircle size={64} className="text-green-600 mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Vote Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6 text-lg">
            You voted for <strong className="text-blue-700 text-xl">{selectedCandidate?.fullName}</strong> from {selectedCandidate?.partyName || selectedCandidate?.party}.
          </p>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              Thank you for participating in the democratic process. Your vote has been recorded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto mt-28 px-4">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  // Candidate Detail View
  if (showCandidateDetail && selectedCandidateDetail) {
    return (
      <div className="max-w-4xl mx-auto mt-28 px-4">
        <div className="bg-white rounded-xl shadow-lg border p-6">
          {/* Back Button */}
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Election</span>
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Candidate Photo and Basic Info */}
            <div className="flex flex-col items-center md:items-start space-y-6">
              <div className="relative">
                <img
                  src={selectedCandidateDetail.photo || "/default-profile.png"}
                  alt={selectedCandidateDetail.fullName}
                  className="w-48 h-48 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                  onError={(e) => {
                    e.target.src = "/default-profile.png";
                  }}
                />
                {selectedCandidateDetail.politicalSign && (
                  <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border">
                    <img
                      src={selectedCandidateDetail.politicalSign}
                      alt="Party Symbol"
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {selectedCandidateDetail.fullName}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {selectedCandidateDetail.partyName }
                  </span>
                </div>
                <p className="text-gray-600">{selectedCandidateDetail.position}</p>
              </div>

              {/* Vote Button */}
              {!hasVoted && (
                <button
                  onClick={() => handleVote(selectedCandidateDetail)}
                  className="w-full md:w-auto px-8 py-3 mt-8 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold text-lg shadow-lg"
                >
                  Vote for {selectedCandidateDetail.fullName}
                </button>
              )}
            </div>

            {/* Candidate Details */}
            <div className="flex-1 space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-800">{selectedCandidateDetail.email || "N/A"}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Age</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-800">{selectedCandidateDetail.age || "N/A"} years</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gender</label>
                      <p className="text-gray-800 mt-1 capitalize">{selectedCandidateDetail.gender || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Party</label>
                      <p className="text-gray-800 mt-1 font-medium">
                        {selectedCandidateDetail.partyName || selectedCandidateDetail.party || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manifesto */}
              {selectedCandidateDetail.manifesto && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Manifesto & Vision
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedCandidateDetail.manifesto}
                  </p>
                </div>
              )}

              {/* Political Symbol */}
              {selectedCandidateDetail.politicalSign && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Political Symbol</h2>
                  <div className="flex items-center gap-6">
                    <img
                      src={selectedCandidateDetail.politicalSign}
                      alt="Political Symbol"
                      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">
                        {selectedCandidateDetail.partyName || selectedCandidateDetail.party}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Already Voted Message */}
          {hasVoted && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800 font-medium">
                You have already cast your vote.
              </p>
            </div>
          )}
        </div>

        {/* Verification Modal */}
        {showVerifier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Verification Required</h3>
                <button
                  onClick={() => {
                    setShowVerifier(false);
                    setPendingCandidate(null);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Please verify your identity to vote for <strong>{pendingCandidate?.fullName}</strong>.
              </p>

              <div className="p-4 border rounded bg-gray-50 text-center">
                <p className="mb-4">Verification component would appear here</p>
                <button
                  onClick={onVerificationComplete}
                  className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-900 disabled:opacity-50"
                  disabled={verifLoading}
                >
                  {verifLoading ? "Verifying..." : "Simulate Verification"}
                </button>
              </div>

              {verifError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  {verifError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-28 px-4">
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-20 h-20 bg-purple-100 rounded-full blur-xl opacity-60"></div>
          <div className="absolute top-0 right-1/4 w-16 h-16 bg-blue-100 rounded-full blur-lg opacity-50"></div>
          <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-indigo-100 rounded-full blur-xl opacity-40"></div>
        </div>

        <h2 className="text-5xl font-bold text-indigo-500/90 mb-6 leading-tight">
          Vote for Change
        </h2>

        <p className="text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Select Your Representative
        </p>

        <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
          Click on any candidate to view their complete profile and manifesto
        </p>

        <div className="mt-8 flex justify-center">
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-indigo-300 to-transparent rounded-full"></div>
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-red-700 font-medium">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {hasVoted && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-yellow-800 font-medium">
            You have already cast your vote in this election.
          </p>
        </div>
      )}

      {candidatesLoading ? (
        <div className="text-center text-gray-500 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
          Loading candidates...
        </div>
      ) : candidates.length === 0 ? (
        <div className="col-span-3 text-center text-gray-500 py-8 bg-white rounded-lg border border-gray-200">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg mb-2">No candidates available</p>
          <p className="text-gray-600 mb-4">Candidates will appear here once registered by the electoral committee.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate) => (
            <div
              key={candidate._id || candidate.id}
              className="bg-white border rounded-xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleViewDetails(candidate)}
            >
              {/* Candidate Photo */}
              <div className="relative mb-4">
                <img
                  src={candidate.photo || "/default-profile.png"}
                  alt={candidate.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-md"
                  onError={(e) => {
                    e.target.src = "/default-profile.png";
                  }}
                />
                {/* Party Symbol Badge */}
                {candidate.politicalSign && (
                  <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-lg border">
                    <img
                      src={candidate.politicalSign}
                      alt="Party Symbol"
                      className="w-10 h-10 object-cover rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Candidate Info */}
              <h3 className="font-bold text-gray-800 text-xl mb-2">{(candidateNameMap[(candidate._id || candidate.id || candidate.name || '').toString().toLowerCase()] ?? candidate.fullName ?? candidate.name) ?? "Unnamed Candidate"}</h3>
              <div className="mb-3">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {candidate.partyName || candidate.party || "Independent"}
                </span>
              </div>
              <div className="mb-3">
                <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-sm">
                  {candidate.position || "Candidate"}
                </span>
              </div>

              {/* Manifesto Preview */}
              {candidate.manifesto && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {candidate.manifesto}
                </p>
              )}

              {/* Cast Vote Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleVote(candidate);
                }}
                className="w-full px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium shadow-md"
              >
                Cast Vote
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      {showVerifier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Verification Required</h3>
              <button
                onClick={() => {
                  setShowVerifier(false);
                  setPendingCandidate(null);
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Please verify your identity to vote for <strong>{pendingCandidate?.fullName}</strong>.
            </p>

            <div className="p-4 border rounded bg-gray-50 text-center">
              <p className="mb-4">Verification component would appear here</p>
              <button
                onClick={onVerificationComplete}
                className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-900 disabled:opacity-50"
                disabled={verifLoading}
              >
                {verifLoading ? "Verifying..." : "Simulate Verification"}
              </button>
            </div>

            {verifError && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {verifError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// MAIN DASHBOARD 
const VoterDashboard = () => {
  const [page, setPage] = useState("feed");
  const { user, loading } = useAuth();

  console.log("Current page:", page);
  console.log("User state:", user);
  console.log("Loading state:", loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar setPage={setPage} />
      {page === "feed" && <FeedPage />}
      {page === "profile" && <ProfilePage />}
      {page === "votenow" && <VoteNowPage />}
    </div>
  );
};

export default VoterDashboard;