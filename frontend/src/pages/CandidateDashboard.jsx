import React, { useState, useContext, createContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Video, X, Edit2, Trash2, Save, LogOut } from "lucide-react";
import { getPosts, createPost, updatePost, deletePost, updateUserProfile } from "../api/endpoints";
import LivePoll from "../components/LivePoll";

// -------- Auth Context --------
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: 1,
    fullName: "Anuska",
    email: "anuska@example.com",
    bio: "",
    profilePic: null,
    politicalSign: null,
    signName: "",
  });

  const updateProfilePic = async (newPicUrl) => {
    setUser((u) => ({ ...u, profilePic: newPicUrl }));
    await updateUserProfile(user.id, { profilePic: newPicUrl });
  };

  const updateBio = async (newBio) => {
    setUser((u) => ({ ...u, bio: newBio }));
    await updateUserProfile(user.id, { bio: newBio });
  };

  const updatePoliticalSign = async (url) => {
    setUser((u) => ({ ...u, politicalSign: url }));
    await updateUserProfile(user.id, { politicalSign: url });
  };

  return (
    <AuthContext.Provider value={{ user, updateProfilePic, updateBio, updatePoliticalSign, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// -------- Navbar --------
const Navbar = ({ setPage, search, setSearch }) => {
  const navigate = useNavigate();
  const handleLogout = () => navigate("/");

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
  const isOwner = post.authorId === user.id;

  const saveEdit = async () => {
    try {
      const updatedPost = { ...post, text: editText };
      await updatePost(post.id, updatedPost);
      onSaveEdit(post.id, editText);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update post:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      onDelete(post.id);
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <img src={post.authorPic} alt="author" className="w-10 h-10 rounded-full object-cover border cursor-pointer" onClick={() => onViewMedia(post.authorPic, "image")} />
        <div className="flex-1">
          <div className="font-semibold">{post.authorName}</div>
          <div className="text-xs text-gray-500">{post.time}</div>
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
        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full border rounded p-2" />
      ) : (
        post.text && <p className="mb-3 text-gray-800">{post.text}</p>
      )}

      {post.media && post.media.type === "image" && (
        <img src={post.media.url} alt="post" className="w-full object-contain rounded-lg border cursor-pointer max-h-[600px]" onClick={() => onViewMedia(post.media.url, "image")} />
      )}
      {post.media && post.media.type === "video" && (
        <video src={post.media.url} controls className="w-full rounded-lg border cursor-pointer max-h-[600px]" onClick={() => onViewMedia(post.media.url, "video")} />
      )}
    </div>
  );
};

// -------- PostCreator --------
const PostCreator = ({ user, posts, setPosts }) => {
  const [text, setText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);

  const handlePickMedia = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedMedia({ type, url });
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!text && !selectedMedia) return;

    const newPost = {
      authorId: user.id,
      authorName: user.fullName,
      authorPic: user.profilePic,
      text,
      media: selectedMedia,
      time: new Date().toLocaleString(),
    };

    try {
      const savedPost = await createPost(newPost);
      setPosts([savedPost, ...posts]);
      setText("");
      setSelectedMedia(null);
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <img src={user.profilePic} alt="profile" className="w-10 h-10 rounded-full object-cover border" />
        <textarea
          placeholder={`What's on your mind, ${user.fullName}?`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border rounded-full px-4 py-2 outline-none resize-none"
          rows={1}
        />
      </div>
      {selectedMedia && (
        <div className="relative mb-3">
          {selectedMedia.type === "image" ? (
            <img src={selectedMedia.url} alt="preview" className="w-full rounded border object-contain max-h-[300px]" />
          ) : (
            <video src={selectedMedia.url} controls className="w-full rounded border max-h-[300px]" />
          )}
          <button type="button" className="absolute top-2 right-2 bg-black bg-opacity-60 text-white p-1 rounded-full" onClick={() => setSelectedMedia(null)}>
            <X size={18} />
          </button>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Camera className="w-5 h-5 text-gray-700" />
            <span className="text-sm">Photo</span>
            <input type="file" accept="image/*" onChange={(e) => handlePickMedia(e, "image")} className="hidden" />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Video className="w-5 h-5 text-gray-700" />
            <span className="text-sm">Video</span>
            <input type="file" accept="video/*" onChange={(e) => handlePickMedia(e, "video")} className="hidden" />
          </label>
        </div>
        <button onClick={handlePostSubmit} className="px-4 py-2 rounded bg-blue-800 text-white">
          Post
        </button>
      </div>
    </div>
  );
};

// -------- FeedPage --------
const FeedPage = ({ posts, setPosts, onViewMedia, search }) => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts();
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      }
    };
    fetchPosts();
  }, [setPosts]);

  const filtered = posts.filter((p) => {
    const s = search.toLowerCase();
    return !search || p.authorName.toLowerCase().includes(s) || (p.text && p.text.toLowerCase().includes(s));
  });

  return (
    <div className="max-w-2xl mx-auto mt-28 px-4">
      <PostCreator user={user} posts={posts} setPosts={setPosts} />
      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 border bg-white p-6 rounded-lg">No posts yet.</div>
        ) : (
          filtered.map((p) => (
            <PostCard key={p.id} post={p} user={user} onViewMedia={onViewMedia} onDelete={(id) => setPosts(posts.filter(p => p.id !== id))} onSaveEdit={(id, newText) => setPosts(posts.map(p => p.id === id ? {...p, text: newText} : p))} />
          ))
        )}
      </div>
    </div>
  );
};

// -------- MediaModal --------
const MediaModal = ({ media, onClose }) => {
  if (!media) return null;
  const isImage = media.type === "image";
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <button onClick={onClose} className="absolute top-6 right-6 text-white hover:text-red-400">
        <X size={28} />
      </button>
      {isImage ? (
        <img src={media.url} alt="preview" className="max-w-[92%] max-h-[92%] rounded-lg object-contain" />
      ) : (
        <video src={media.url} controls autoPlay className="max-w-[92%] max-h-[92%] rounded-lg" />
      )}
    </div>
  );
};

// -------- ProfilePage --------
const ProfilePage = ({ posts, setPosts, onViewMedia }) => {
  const { user, updateProfilePic, updateBio, updatePoliticalSign, setUser } = useContext(AuthContext);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user.bio);

  const saveBio = async () => {
    await updateBio(bioText);
    setIsEditingBio(false);
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    await updateProfilePic(url);
  };

  const handlePoliticalSignChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    await updatePoliticalSign(url);
  };

  const userPosts = posts.filter((p) => p.authorId === user.id);

  const handleDelete = async (id) => {
    try {
      await deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleSaveEdit = async (id, newText) => {
    try {
      const post = userPosts.find(p => p.id === id);
      await updatePost(id, { ...post, text: newText });
      setPosts(posts.map(p => p.id === id ? { ...p, text: newText } : p));
    } catch (error) {
      console.error("Failed to update post:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-28 px-4 space-y-6">
      {/* Profile Info */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col items-center relative">
        <div className="relative w-28 h-28 rounded-full border overflow-visible flex items-center justify-center bg-gray-100">
          {user.profilePic ? <img src={user.profilePic} alt="profile" className="w-full h-full object-cover rounded-full" onClick={() => onViewMedia(user.profilePic, "image")} /> : <span className="text-gray-500 text-sm font-medium">profile</span>}
          <label className="absolute -bottom-1 -right-1 bg-gray-800 p-2 rounded-full cursor-pointer shadow-md">
            <Camera className="w-5 h-5 text-white" />
            <input type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
          </label>
        </div>

        <div className="mt-3 text-center w-full">
          <div className="text-lg font-semibold">{user.fullName}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
          <div className="mt-3 w-full">
            {isEditingBio ? (
              <>
                <textarea value={bioText} onChange={(e) => setBioText(e.target.value)} className="w-full border rounded p-2" rows={3} />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setIsEditingBio(false)} className="px-3 py-1 rounded border">Cancel</button>
                  <button onClick={saveBio} className="px-3 py-1 rounded bg-blue-800 text-white">Save</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-700">{user.bio}</p>
                <button onClick={() => setIsEditingBio(true)} className="mt-2 text-sm text-blue-700 hover:underline">Edit Bio</button>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-col items-center">
            <div className="relative w-28 h-28 rounded-full border overflow-visible flex items-center justify-center bg-gray-100 cursor-pointer">
              {user.politicalSign ? <img src={user.politicalSign} alt="Political Sign" className="w-full h-full object-cover rounded-full" onClick={() => onViewMedia(user.politicalSign, "image")} /> : <span className="text-gray-400 text-sm">No Sign</span>}
              <label className="absolute -bottom-1 -right-1 bg-gray-800 p-2 rounded-full cursor-pointer shadow-md">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" onChange={handlePoliticalSignChange} className="hidden" />
              </label>
            </div>
            <input type="text" placeholder="Enter Sign Name" value={user.signName} onChange={(e) => setUser(u => ({ ...u, signName: e.target.value }))} className="mt-2 w-40 text-center border rounded px-2 py-1 text-sm focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Create Post */}
      <PostCreator user={user} posts={posts} setPosts={setPosts} />

      {/* User Posts */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Your Posts</h3>
        {userPosts.length === 0 ? (
          <div className="text-gray-500 p-4 border rounded bg-white">No posts yet.</div>
        ) : (
          userPosts.map((p) => <PostCard key={p.id} post={p} user={user} onViewMedia={onViewMedia} onDelete={handleDelete} onSaveEdit={handleSaveEdit} />)
        )}
      </div>
    </div>
  );
};

// -------- CandidateDashboard --------
const CandidateDashboard = () => {
  const [page, setPage] = useState("feed");
  const [search, setSearch] = useState("");
  const [media, setMedia] = useState(null);
  const [posts, setPosts] = useState([]);

  const onViewMedia = (url, type) => setMedia({ url, type });
  const onCloseMedia = () => setMedia(null);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <Navbar setPage={setPage} search={search} setSearch={setSearch} />
        {page === "feed" && (
          <>
            <div className="max-w-2xl mx-auto mt-28 px-4">
              <LivePoll />
            </div>
            <FeedPage posts={posts} setPosts={setPosts} onViewMedia={onViewMedia} search={search} />
          </>
        )}
        {page === "profile" && <ProfilePage posts={posts} setPosts={setPosts} onViewMedia={onViewMedia} />}
        <MediaModal media={media} onClose={onCloseMedia} />
      </div>
    </AuthProvider>
  );
};

export default CandidateDashboard;
