const express = require('express');
const postController = require('../controllers/postController');
const router = express.Router();
const { editComment, deleteComment } = require("../controllers/postController");


// GET /api/posts
router.get('/', postController.getPosts);

// POST /api/posts
router.post('/', postController.createPost);

// PUT /api/posts/:postId
router.put('/:postId', postController.updatePost);

// DELETE /api/posts/:postId
router.delete('/:postId', postController.deletePost);


// POST /api/posts/:postId/reactions
router.post('/:postId/reactions', postController.addReaction);

// POST /api/posts/:postId/comments
router.post('/:postId/comments', postController.addComment);

// Edit comment
router.put("/comments/:commentId", editComment);

// Delete comment
router.delete("/comments/:commentId", deleteComment);

module.exports = router;