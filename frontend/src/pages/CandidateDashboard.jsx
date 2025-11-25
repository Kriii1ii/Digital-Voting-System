import React, { useState, useEffect, useRef } from "react";
import { Camera, Video, X, Edit2, Trash2, Save, LogOut, ThumbsUp, MessageCircle, User } from "lucide-react";
import { getPosts, createPost, updatePost, deletePost } from "../api/endpoints";
import { useAuth } from "../contexts/AuthContext";
//Notification
const Notification = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border ${
      type === "success" 
        ? "bg-green-100 border-green-400 text-green-800" 
        : "bg-red-100 border-red-400 text-red-800"
    }`}>
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// -------- Navbar --------
const Navbar = ({ setPage, search, setSearch }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-blue-50 text-black flex items-center justify-between px-6 py-3 shadow-md fixed w-full top-0 left-0 z-20">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPage("feed")}>
        <img src="/logo.png" alt="logo" className="h-22 w-auto object-contain cursor-pointer" />
      </div>
      <div className="hidden md:block w-1/3 mx-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring"
        />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setPage("feed")} className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900">
          Feed
        </button>
        <button onClick={() => setPage("profile")} className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900">
          Profile
        </button>
        <button onClick={handleLogout} className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 flex items-center gap-1">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </nav>
  );
};

// -------- PostCard --------
const PostCard = ({ post, user, onViewMedia, onDelete, onSaveEdit }) => {
  const [editText, setEditText] = useState(post.text);
  const [isEditing, setIsEditing] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const candidateData=JSON.parse(localStorage.getItem('user'))
  
  const authorImageErrorRef = useRef(false);
  const mediaImageErrorRef = useRef(false);

  useEffect(() => {
    authorImageErrorRef.current = false;
    mediaImageErrorRef.current = false;
  }, [post.authorPic, post.media?.url]);

  const isOwner = post.author?._id === user?.id || 
                  post.authorId === user?.id || 
                  post.author === user?.id;

  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const saveEdit = async () => {
    if (!editText.trim()) {
      alert("Post text cannot be empty");
      return;
    }
    
    try {
      await updatePost(post._id, { text: editText });
      onSaveEdit(post._id, editText);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update post:", error);
      alert("Failed to update post. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    try {
      await deletePost(post._id);
      onDelete(post._id);
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  // Get author information with multiple fallbacks 
  const getAuthorInfo = () => {
    // Case 1: Author is populated with full object and has profilePic
    if (post.author && typeof post.author === 'object' && post.author.fullName && post.author.photo) {
      return {
        name: post.author.fullName,
        pic: post.author.photo,
        initial: getInitial(post.author.fullName)
      };
    }
    
    // Case 2: Direct authorPic field exists
    if (post.authorPic) {
      return {
        name: post.authorName || (post.author && typeof post.author === 'object' ? post.author.fullName : "User"),
        pic: post.authorPic,
        initial: getInitial(post.authorName || (post.author && typeof post.author === 'object' ? post.author.fullName : "U"))
      };
    }
    
    // Case 3: Current user is the author and has profilePic
    if (isOwner && user && user.photo) {
      return {
        name: user.fullName,
        pic: user.photo,
        initial: getInitial(user.fullName)
      };
    }
    
    // Case 4: Author object exists but no profilePic - show initial
    if (post.author && typeof post.author === 'object' && post.author.fullName) {
      return {
        name: post.author.fullName,
        pic: null, // Force showing initial
        initial: getInitial(post.author.fullName)
      };
    }
    
    // Case 5: Direct authorName but no authorPic - show initial
    if (post.authorName) {
      return {
        name: post.authorName,
        pic: null, // Force showing initial
        initial: getInitial(post.authorName)
      };
    }
    
    // Case 6: Current user is the author but no profilePic
    if (isOwner && user) {
      return {
        name: user.fullName,
        pic: null, 
        initial: getInitial(user.fullName)
      };
    }
    
    // Case 7: Fallback
    return {
      name: "Unknown User",
      pic: null, // Force showing initial
      initial: "U"
    };
  };

  const authorInfo = getAuthorInfo();
  const postDate = post.createdAt ? new Date(post.createdAt).toLocaleString() : 
                   post.time || "Unknown date";

  // Safe image handler to prevent blob URL errors
  const getSafeImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('blob:')) {
      return null;
    }
    return url;
  };

  // Determine what to show based on error state and available data
  const shouldShowAuthorImage = authorInfo.pic && !authorImageErrorRef.current;
  const shouldShowMediaImage = post.media && post.media.type === "image" && !mediaImageErrorRef.current;

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        {shouldShowAuthorImage ? (
          <img 
            src={getSafeImageUrl(authorInfo.pic)} 
            alt="author" 
            className="w-10 h-10 rounded-full object-cover border cursor-pointer" 
            onClick={() => onViewMedia(getSafeImageUrl(authorInfo.pic), "image")} 
            onError={(e) => {
              console.error("Failed toload author image:", authorInfo.pic);
              authorImageErrorRef.current = true;
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full border bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-bold text-sm">{authorInfo.initial}</span>
          </div>
        )}
        <div className="flex-1">
          <div className="font-semibold">{authorInfo.name}</div>
          <div className="text-xs text-gray-500">{postDate}</div>
        </div>
        {isOwner && (
          <div className="flex gap-3 text-gray-600">
            {isEditing ? (
              <button onClick={saveEdit} title="Save" className="hover:text-blue-700">
                <Save size={18} />
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} title="Edit" className="hover:text-blue-700">
                <Edit2 size={18} />
              </button>
            )}
            <button onClick={handleDelete} title="Delete" className="hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea 
          value={editText} 
          onChange={(e) => setEditText(e.target.value)} 
          className="w-full border rounded p-2"
          rows={3}
        />
      ) : (
        post.text && <p className="mb-3 text-gray-800 whitespace-pre-wrap">{post.text}</p>
      )}

      {shouldShowMediaImage && (
        <img 
          src={getSafeImageUrl(post.media.url)} 
          alt="post" 
          className="w-full object-contain rounded-lg border cursor-pointer max-h-[600px]" 
          onClick={() => onViewMedia(getSafeImageUrl(post.media.url), "image")} 
          onError={(e) => {
            mediaImageErrorRef.current = true;
            e.target.style.display = 'none';
          }}
        />
      )}
      {post.media && post.media.type === "video" && (
        <video 
          src={post.media.url} 
          controls 
          className="w-full rounded-lg border cursor-pointer max-h-[600px]" 
          onClick={() => onViewMedia(post.media.url, "video")} 
          onError={(e) => {
            console.error("Failed to load post video:", post.media.url);
            e.target.style.display = 'none';
          }}
        />
      )}

      {/* Reactions and Comments Display (Read-only for candidates) */}
      {(() => {
        // Safely get reactions and comments, ensuring they're arrays
        const reactions = Array.isArray(post.reactions) ? post.reactions : [];
        const comments = Array.isArray(post.comments) ? post.comments : [];
        const totalReactions = reactions.length;
        const totalComments = comments.length;

        // Get top reaction types for display
        const reactionCounts = {};
        reactions.forEach(r => {
          if (r && typeof r === 'object' && r.type) {
            reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
          }
        });

        const topReactionTypes = Object.entries(reactionCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([type]) => {
            const emojiMap = {
              like: '👍',
              love: '❤️',
              haha: '😂',
              wow: '😮',
              sad: '😢',
              angry: '😡'
            };
            return emojiMap[type] || '👍';
          });

        if (totalReactions === 0 && totalComments === 0) {
          return null;
        }

        // Determine which comments to display
        const commentsToDisplay = showAllComments ? comments : comments.slice(0, 5);
        const hasMoreComments = comments.length > 5;

        return (
          <>
            {/* Reaction and Comment Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-2 mt-2">
              <div className="flex items-center gap-2">
                {totalReactions > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {topReactionTypes.map((emoji, index) => (
                        <span key={index} className="text-xs bg-white rounded-full border border-white -ml-1 first:ml-0">
                          {typeof emoji === 'string' ? emoji : '👍'}
                        </span>
                      ))}
                    </div>
                    <span>{totalReactions}</span>
                  </div>
                )}
              </div>
              {totalComments > 0 && (
                <span>{totalComments} {totalComments === 1 ? 'comment' : 'comments'}</span>
              )}
            </div>

            {/* Comments Section (Read-only) */}
            {comments.length > 0 && (
              <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                {commentsToDisplay.map((comment, index) => {
                  // Ensure comment is an object and has required fields
                  if (!comment || typeof comment !== 'object') return null;
                  
                  const commentUser = comment.user || {};
                  const userName = commentUser.fullName || 'Unknown User';
                  const userPic = commentUser.profilePic || null;
                  const commentText = typeof comment.text === 'string' ? comment.text : '';
                  const commentTime = comment.timestamp ? new Date(comment.timestamp).toLocaleTimeString() : '';

                  return (
                    <div key={comment._id || index} className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {userPic ? (
                          <img
                            src={userPic}
                            alt={userName}
                            className="w-8 h-8 rounded-full object-cover border"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border ${userPic ? 'hidden' : ''}`}>
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="font-semibold text-sm">{userName}</div>
                        <div className="text-gray-700 mt-1">{commentText}</div>
                        {commentTime && (
                          <div className="text-xs text-gray-500 mt-1">{commentTime}</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Show more/less comments button */}
                {hasMoreComments && (
                  <div className="text-center">
                    <button
                      onClick={() => setShowAllComments(!showAllComments)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition px-4 py-2 rounded-lg hover:bg-blue-50"
                    >
                      {showAllComments ? 'Show fewer comments' : `View all ${comments.length} comments`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Disabled Action Buttons (Candidates cannot react or comment) */}
            <div className="flex items-center border-t border-gray-100 pt-2 mt-2 text-gray-400">
              <div className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg cursor-not-allowed">
                <ThumbsUp size={18} />
                <span>Like</span>
                <span className="text-xs ml-1">(View only)</span>
              </div>
              <div className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg cursor-not-allowed">
                <MessageCircle size={18} />
                <span>Comment</span>
                <span className="text-xs ml-1">(View only)</span>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
};

// -------- PostCreator --------
const PostCreator = ({ user, posts, setPosts, onPostCreated }) => {
  const [text, setText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get initial from user name
  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const handlePickMedia = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (type === "image" && !file.type.startsWith('image/')) {
      alert("Please select an image file");
      return;
    }
    
    if (type === "video" && !file.type.startsWith('video/')) {
      alert("Please select a video file");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert("File size should be less than 10MB");
      return;
    }
    
    const url = URL.createObjectURL(file);
    setSelectedMedia({ 
      type, 
      url,
      file
    });
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedMedia) {
      alert("Please add some text or media to your post.");
      return;
    }
    if (isSubmitting) return;

    // Validate user has an ID
    if (!user || !user.id) {
      alert("User information is missing. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert file to base64 for proper storage
      let mediaData = undefined;
      
      if (selectedMedia?.file) {
        const base64 = await fileToBase64(selectedMedia.file);
        mediaData = {
          type: selectedMedia.type,
          url: base64,
          filename: selectedMedia.file.name
        };
      }

      // Prepare post data matching the backend schema
      // Only send fields that exist in the Post model schema
      const postData = {
        text: text.trim() || '',
        author: user.id, // Must be a valid Candidate ObjectId
        reactionsCount: 0
        // Note: comments field in schema is String with default 0, so we don't send it
        // createdAt is handled by timestamps option
      };

      // Only include media if it exists
      if (mediaData) {
        postData.media = mediaData;
      }

      console.log("Sending post data:", {
        text: postData.text ? "YES" : "NO",
        author: postData.author,
        hasMedia: !!postData.media
      });

      const savedPost = await createPost(postData);
      
      // Handle different response structures from createPost
      const newPost = savedPost.data || savedPost;
      
      // Create a complete temporary post for immediate display
      const tempPost = {
        ...newPost,
        _id: newPost._id || `temp-${Date.now()}`,
        author: {
          _id: user?.id,
          fullName: user?.fullName,
          photo: user?.photo
        },
        authorName: newPost.authorName || user?.fullName,
        authorPic: newPost.authorPic || user?.photo,
        reactionsCount: newPost.reactionsCount || 0,
        reactions: Array.isArray(newPost.reactions) ? newPost.reactions : [],
        comments: Array.isArray(newPost.comments) ? newPost.comments : [],
        createdAt: newPost.createdAt || new Date().toISOString()
      };
      
      console.log("Created temp post with author data:", {
        author: tempPost.author,
        authorPic: tempPost.authorPic
      });
      
      // Add the new post to the beginning of the posts array
      setPosts(prevPosts => {
        const safePrevPosts = Array.isArray(prevPosts) ? prevPosts : [];
        return [tempPost, ...safePrevPosts];
      });
      
      setText("");
      setSelectedMedia(null);
      
      // Clean up the blob URL
      if (selectedMedia?.url) {
        URL.revokeObjectURL(selectedMedia.url);
      }

      // Show success notification
      if (onPostCreated) {
        onPostCreated("Post created successfully!");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Failed to create post. Please check the data and try again.";
      console.error("Error details:", error.response?.data);
      alert(errorMessage);
      
      // Show error notification
      if (onPostCreated) {
        onPostCreated(errorMessage, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleRemoveMedia = () => {
    if (selectedMedia?.url) {
      URL.revokeObjectURL(selectedMedia.url);
    }
    setSelectedMedia(null);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
      <div className="flex items-center gap-3 mb-3">
        {/* Profile picture in PostCreator */}
        {user?.photo ? (
          <img 
            src={user.photo} 
            alt="profile" 
            className="w-10 h-10 rounded-full object-cover border" 
            onError={(e) => {
              console.error("Failed to load profile picture in PostCreator:", user.photo);
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full border bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-bold text-sm">{getInitial(user?.fullName)}</span>
          </div>
        )}
        <textarea
          placeholder={`What's on your mind, ${user?.fullName || 'User'}?`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2 outline-none resize-none"
          rows={3}
        />
      </div>
      
      {selectedMedia && (
        <div className="relative mb-3">
          {selectedMedia.type === "image" ? (
            <img 
              src={selectedMedia.url} 
              alt="preview" 
              className="w-full rounded border object-contain max-h-[300px]" 
            />
          ) : (
            <video 
              src={selectedMedia.url} 
              controls 
              className="w-full rounded border max-h-[300px]" 
            />
          )}
          <button 
            type="button" 
            className="absolute top-2 right-2 bg-black bg-opacity-60 text-white p-1 rounded-full hover:bg-opacity-80"
            onClick={handleRemoveMedia}
          >
            <X size={18} />
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
            <Camera className="w-5 h-5" />
            <span className="text-sm">Photo</span>
            <input 
              type="file" 
              accept="image/" 
              onChange={(e) => handlePickMedia(e, "image")} 
              className="hidden" 
            />
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
            <Video className="w-5 h-5" />
            <span className="text-sm">Video</span>
            <input 
              type="file" 
              accept="video/" 
              onChange={(e) => handlePickMedia(e, "video")} 
              className="hidden" 
            />
          </label>
        </div>
        <button
          onClick={handlePostSubmit}
          disabled={isSubmitting || (!text.trim() && !selectedMedia)}
          className="px-4 py-2 rounded bg-blue-800 text-white hover:bg-blue-900 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
};

// -------- FeedPage --------
const FeedPage = ({ posts, setPosts, onViewMedia, search, onPostCreated }) => {
  const { user } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts();
        console.log("Fetched posts data:", data);
        
        // Ensure all posts have properly initialized reactions and comments arrays
        const normalizedPosts = Array.isArray(data) ? data.map(post => ({
          ...post,
          reactions: Array.isArray(post.reactions) ? post.reactions.filter(r => r && typeof r === 'object') : [],
          comments: Array.isArray(post.comments) ? post.comments.filter(c => c && typeof c === 'object') : []
        })) : [];
        
        setPosts(normalizedPosts);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        setPosts([]);
      }
    };
    fetchPosts();
  }, [setPosts, user]);

  // Ensure posts is always treated as an array
  const safePosts = Array.isArray(posts) ? posts : [];
  
  const filtered = safePosts.filter((p) => {
    if (!search) return true;
    
    const searchTerm = search.toLowerCase();
    return (
      p.author?.fullName?.toLowerCase().includes(searchTerm) ||
      (p.text && p.text.toLowerCase().includes(searchTerm))
    );
  });

  return (
    <div className="max-w-2xl mx-auto mt-28 px-4">
      <PostCreator 
        user={user} 
        posts={safePosts} 
        setPosts={setPosts} 
        onPostCreated={onPostCreated}
      />
      
      <div className="mt-6">
        {!Array.isArray(posts) ? (
          <div className="text-center text-red-500 border bg-white p-6 rounded-lg">
            Error: Posts data is invalid
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 border bg-white p-6 rounded-lg">
            {safePosts.length === 0 ? "No posts available. Be the first to post!" : "No posts match your search."}
          </div>
        ) : (
          filtered.map((p) => (
            <PostCard
              key={p._id}
              post={p}
              user={user}
              onViewMedia={onViewMedia}
              onDelete={(id) => setPosts(safePosts.filter(post => post._id !== id))}
              onSaveEdit={(id, newText) => setPosts(safePosts.map(post => 
                post._id === id ? { ...post, text: newText } : post
              ))}
            />
          ))
        )}
      </div>
    </div>
  );
};

// -------- MediaModal --------
const MediaModal = ({ media, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!media) return null;
  
  const isImage = media.type === "image";
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" 
      onClick={(e) => { 
        if (e.target === e.currentTarget) onClose(); 
      }}
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white hover:text-red-400 bg-black bg-opacity-50 rounded-full p-2 z-10 transition-colors"
      >
        <X size={24} />
      </button>
      
      <div className="relative max-w-full max-h-full">
        {isImage ? (
          <img 
            src={media.url} 
            alt="preview" 
            className="max-w-full max-h-full rounded-lg object-contain"
            onError={(e) => {
              console.error("Failed to load media:", media.url);
              e.target.alt = "Failed to load image";
            }}
          />
        ) : (
          <video 
            src={media.url} 
            controls 
            autoPlay 
            className="max-w-full max-h-full rounded-lg"
            onError={(e) => {
              console.error("Failed to load media:", media.url);
            }}
          />
        )}
      </div>
    </div>
  );
};

// -------- ProfilePage --------
const ProfilePage = ({ posts, setPosts, onViewMedia, onPostCreated }) => {
  const { user } = useAuth();
  
  const safePosts = Array.isArray(posts) ? posts : [];

  // Filter posts to show only the current user's posts
  const userPosts = safePosts.filter((p) => {
    return p.author?._id === user?.id || 
           p.authorId === user?.id || 
           p.author === user?.id;
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }
    
    try {
      await deletePost(id);
      setPosts(safePosts.filter(p => p._id !== id));
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  const handleSaveEdit = async (id, newText) => {
    try {
      await updatePost(id, { text: newText });
      setPosts(safePosts.map(p => p._id === id ? { ...p, text: newText } : p));
    } catch (error) {
      console.error("Failed to update post:", error);
      alert("Failed to update post. Please try again.");
    }
  };

  if (!user) {
    return <div className="max-w-2xl mx-auto mt-28 px-4">Loading user data...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-28 px-4 space-y-6">
      {/* Profile Info */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col items-center relative">
        <div className="relative">
          <div className="w-40 h-40 rounded-full border-4 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-100 relative">
            {user.photo ? (
              <img 
                src={user.photo} 
                alt="profile" 
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => onViewMedia(user.photo, "image")}
                onError={(e) => {
                  console.error("Failed to load profile picture:", user.photo);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-gray-400 text-4xl font-bold">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
          </div>
        </div>

        <h2 className="mt-4 text-2xl font-semibold text-gray-800">{user.fullName}</h2>
        <p className="text-gray-500">{user.email}</p>

        {/* Political Sign Section */}
        <div className="mt-8 flex flex-col items-center">
          <h3 className="text-2xl font-semibold mb-4">Political Sign</h3>
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-100 relative">
              {user.politicalSign ? (
                <img 
                  src={user.politicalSign} 
                  alt="Political Sign" 
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => onViewMedia(user.politicalSign, "image")}
                  onError={(e) => {
                    console.error("Failed to load political sign:", user.politicalSign);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm text-center px-2">No Sign</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 text-center">
            <div className="text-lg font-semibold text-black">{user.partyName}</div>
          </div>
        </div>
      </div>

      {/* Create Post - This will appear in both feed and profile */}
      <PostCreator 
        user={user} 
        posts={safePosts} 
        setPosts={setPosts} 
        onPostCreated={onPostCreated}
      />

      {/* User Posts - Only shows posts created by this user */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Your Posts ({userPosts.length})</h3>
        {userPosts.length === 0 ? (
          <div className="text-gray-500 p-4 border rounded bg-white text-center">
            You haven't created any posts yet. Share your thoughts with the community!
          </div>
        ) : (
          userPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              user={user}
              onViewMedia={onViewMedia}
              onDelete={handleDelete}
              onSaveEdit={handleSaveEdit}
            />
          ))
        )}
      </div>
    </div>
  );
};

// -------- Main CandidateDashboard Component --------
const CandidateDashboard = () => {
  const [page, setPage] = useState("feed");
  const [search, setSearch] = useState("");
  const [media, setMedia] = useState(null);
  const [posts, setPosts] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: "", type: "success" });

  // Debug posts state
  useEffect(() => {
    console.log("Current posts state:", {
      type: typeof posts,
      isArray: Array.isArray(posts),
      value: posts
    });
  }, [posts]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
  };

  const hideNotification = () => {
    setNotification({ show: false, message: "", type: "success" });
  };

  const onViewMedia = (url, type) => {
    // Only allow viewing of non-blob URLs
    if (url && type && !url.startsWith('blob:')) {
      setMedia({ url, type });
    }
  };
  
  const onCloseMedia = () => setMedia(null);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar setPage={setPage} search={search} setSearch={setSearch} />
      
      {notification.show && (
        <Notification 
          message={notification.message} 
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      
      {page === "feed" && (
        <FeedPage 
          posts={posts} 
          setPosts={setPosts} 
          onViewMedia={onViewMedia} 
          search={search}
          onPostCreated={showNotification}
        />
      )}
      {page === "profile" && (
        <ProfilePage 
          posts={posts} 
          setPosts={setPosts} 
          onViewMedia={onViewMedia}
          onPostCreated={showNotification}
        />
      )}
      <MediaModal media={media} onClose={onCloseMedia} />
    </div>
  );
};

export default CandidateDashboard;