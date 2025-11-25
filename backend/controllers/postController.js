const mongoose = require("mongoose");
const axios = require("axios");

const Post = require("../models/Post");
const Reaction = require("../models/Reaction");
const Comment = require("../models/Comment");
const { buildElectionPrediction } = require('../services/predictionPollService');

const AI_PREDICTION_URL = process.env.AI_PREDICTION_URL;

const asId = (id) =>
  mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;


exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "fullName photo")
      .populate("candidate", "fullName photo party")
      .populate("election", "title startDate endDate")
      .sort({ createdAt: -1 });

    // Get reactions and comments for each post
    const postsWithInteractions = await Promise.all(
      posts.map(async (post) => {
        try {
          const reactions = await Reaction.find({ post: post._id })
            .populate('user', 'fullName profilePicture');
          
          const comments = await Comment.find({ post: post._id })
            .populate('user', 'fullName profilePicture')
            .sort({ createdAt: -1 });

          return {
            ...post.toObject(),
            reactions: reactions
              .filter(r => r.user) // Filter out reactions with null user
              .map(r => ({
                user_id: r.user._id,
                user: {
                  fullName: r.user.fullName || 'Unknown User',
                  profilePic: r.user.profilePicture || null
                },
                type: r.type
              })),
            comments: comments
              .filter(c => c.user) // Filter out comments with null user
              .map(c => ({
                _id: c._id,
                user_id: c.user._id,
                user: {
                  fullName: c.user.fullName || 'Unknown User',
                  profilePic: c.user.profilePicture || null
                },
                text: c.text,
                timestamp: c.createdAt
              }))
          };
        } catch (postErr) {
          console.error(`Error processing post ${post._id}:`, postErr);
          // Return post without interactions if there's an error
          return {
            ...post.toObject(),
            reactions: [],
            comments: []
          };
        }
      })
    );
    return res.json({ success: true, data: postsWithInteractions });
  } catch (err) {
    console.error("getPosts error:", err);
    console.error("Error details:", err.message, err.stack);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to fetch posts",
      message: err.message 
    });
  }
};


exports.createPost = async (req, res) => {
  try {
    // Automatically assign logged-in user as author
    const body = req.body
    console.log("createPost body:", body);
    
    // Validate required fields
    if (!body.author) {
      return res.status(400).json({ 
        success: false, 
        error: "Author field is required",
        message: "Author (candidate ID) must be provided"
      });
    }

    // Validate author is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(body.author)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid author ID",
        message: "Author must be a valid ObjectId"
      });
    }

    const post = await Post.create(body);

    // Return populated post
    const populated = await Post.findById(post._id)
      .populate("author", "fullName photo party")
      .populate("candidate", "fullName photo party")
      .populate("election", "title");

    return res.json({ success: true, data: populated });
  } catch (err) {
    console.error("createPost error:", err);
    console.error("Error details:", err.message, err.stack);
    return res.status(400).json({ 
      success: false, 
      error: "Failed to create post",
      message: err.message || "Unknown error occurred"
    });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const updated = await Post.findByIdAndUpdate(req.params.postId, req.body, {
      new: true,
    })
      .populate("author", "fullName profilePicture role")
      .populate("candidate", "fullName photo party")
      .populate("election", "title startDate endDate");

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updatePost error:", err);
    return res.status(400).json({ success: false, error: "Failed to update post" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.postId);
    return res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    console.error("deletePost error:", err);
    return res.status(400).json({ success: false, error: "Failed to delete post" });
  }
};

exports.addReaction = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { userId, type = "like" } = req.body; // Add type parameter

    if (!postId || !userId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Find existing reaction
    const existingReaction = await Reaction.findOne({ user: userId, post: postId });
    
    if (existingReaction) {
      if (existingReaction.type === type) {
        // Remove reaction if same type clicked again
        await Reaction.findByIdAndDelete(existingReaction._id);
        await Post.updateOne({ _id: postId }, { $inc: { reactionsCount: -1 } });
        
        return res.json({ 
          message: 'Reaction removed successfully', 
          success: true,
          removed: true 
        });
      } else {
        // Update reaction type
        existingReaction.type = type;
        await existingReaction.save();
        
        return res.json({ 
          success: true, 
          reaction: existingReaction,
          updated: true 
        });
      }
    } else {
      // Create new reaction
      const reaction = await Reaction.create({
        user: userId,
        post: postId,
        type: type
      });

      // Increment reactions count
      await Post.updateOne({ _id: postId }, { $inc: { reactionsCount: 1 } });

      // Recompute and emit predictions for the related election (best-effort)
      try {
        const post = await Post.findById(postId).lean();
        const electionId = post?.election || post?.election_id || null;
        if (electionId) {
          const payload = await buildElectionPrediction({ electionId: String(electionId) });
          const io = req.app.get('io');
          if (io) io.to(`prediction:${String(electionId)}`).emit('prediction:update', payload);
        }
      } catch (e) {
        console.warn('Prediction refresh failed after reaction:', e?.message || e);
      }

      return res.json({ 
        success: true, 
        reactionId: reaction._id,
        added: true 
      });
    }
  } catch (err) {
    console.error("addReaction error:", err);
    return res.status(500).json({ error: err.message });
  }
};
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { userId, text } = req.body; // Changed from user_id to userId

    if (!postId || !userId || !text) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const comment = await Comment.create({
      user: userId, // Fixed field name
      post: postId, // Fixed field name
      text,
    });

    // Fetch post for election
    const post = await Post.findById(postId);
    const electionId = post?.election;

    // Update AI model
    if (electionId && AI_PREDICTION_URL) {
      try {
        const url = `${AI_PREDICTION_URL.replace(/\/$/, "")}/predict?election_id=${encodeURIComponent(electionId)}`;
        const resp = await axios.get(url, { timeout: 10000 });

        const io = req.app.get("io");
        if (io) {
          io.to(`prediction:${String(electionId)}`).emit("prediction:update", resp.data);
        }
      } catch (err) {
        console.warn("AI refresh failed after comment:", err.message);
      }
    }

    // Populate the comment with user data before sending response
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'fullName profilePicture');

    // Comment event to frontend
    const io = req.app.get("io");
    if (io) {
      io.emit("comment:created", { postId, userId, text });
      // Also emit prediction refresh via central service (best-effort)
      try {
        if (post?.election || post?.election_id) {
          const payload = await buildElectionPrediction({ electionId: String(post.election || post.election_id) });
          io.to(`prediction:${String(post.election || post.election_id)}`).emit('prediction:update', payload);
        }
      } catch (e) {
        console.warn('Prediction refresh failed after comment emit:', e?.message || e);
      }
    }

    return res.json({ 
      success: true, 
      comment: populatedComment // Send populated comment
    });
  } catch (err) {
    console.error("addComment error:", err);
    return res.status(500).json({ error: "Failed to add comment" });
  }
};
exports.editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }
    // Check owner
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You cannot edit this comment" });
    }

    comment.text = text;
    comment.updatedAt = new Date();
    await comment.save();

    const updated = await Comment.findById(commentId)
      .populate("user", "fullName profilePicture");

    return res.json({
      success: true,
      message: "Comment updated",
      data: updated
    });
  } catch (err) {
    console.error("editComment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Ownership check
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You cannot delete this comment" });
    }

    await comment.deleteOne();

    return res.json({
      success: true,
      message: "Comment deleted"
    });
  } catch (err) {
    console.error("deleteComment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};