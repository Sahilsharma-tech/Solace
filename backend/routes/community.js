const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const CommunityPost = require('../models/Community');
const User = require('../models/User');

router.get('/posts', verifyToken, async (req, res) => {
  try {
    const { category, limit = 20, skip = 0 } = req.query;

    const query = { isModerated: false };
    if (category && category !== 'all') {
      query.category = category;
    }

    const posts = await CommunityPost.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-userId');

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Get Posts Error:', error);
    res.status(500).json({ error: 'Failed to retrieve posts' });
  }
});
router.post('/posts', verifyToken, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }

    const post = new CommunityPost({
      userId: req.userId,
      title,
      content,
      category: category || 'general',
      tags: tags || []
    });

    await post.save();

    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'gamification.points': 15 }
    });

    res.json({
      success: true,
      post: {
        id: post._id,
        anonymousName: post.anonymousName,
        title: post.title,
        content: post.content,
        category: post.category,
        tags: post.tags,
        createdAt: post.createdAt
      }
    });
  } catch (error) {
    console.error('Create Post Error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});
router.post('/posts/:postId/like', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const alreadyLiked = post.likedBy.includes(req.userId);

    if (alreadyLiked) {
      post.likes -= 1;
      post.likedBy = post.likedBy.filter(id => id.toString() !== req.userId.toString());
    } else {
      post.likes += 1;
      post.likedBy.push(req.userId);
    }

    await post.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likes: post.likes
    });
  } catch (error) {
    console.error('Like Post Error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});
router.post('/posts/:postId/comments', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Comment content required' });
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const adjectives = ['Brave', 'Strong', 'Peaceful', 'Gentle', 'Kind', 'Calm', 'Wise'];
    const nouns = ['Soul', 'Heart', 'Spirit', 'Mind', 'Friend', 'Warrior', 'Phoenix'];
    const anonymousName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;

    post.comments.push({
      userId: req.userId,
      anonymousName,
      content
    });

    await post.save();

    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'gamification.points': 5 }
    });

    res.json({
      success: true,
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    console.error('Comment Error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});
router.get('/posts/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await CommunityPost.findById(postId).select('-userId -comments.userId');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get Post Error:', error);
    res.status(500).json({ error: 'Failed to retrieve post' });
  }
});

module.exports = router;
