const User = require('../models/user.model');

const getAllVideoResumes = async (req, res) => {
  try {
    const usersWithVideos = await User.find(
      { videoIntroUrl: { $exists: true, $ne: '' } },
      '_id fullName email photo videoIntroUrl skills videoViews videoLikes likedBy',
    );

    res.status(200).json({
      success: true,
      count: usersWithVideos.length,
      videoResumes: usersWithVideos,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const incrementVideoResumeView = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { videoViews: 1 } },
      { new: true },
    ).select('videoViews');

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, views: user.videoViews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVideoResumesByTags = async (req, res) => {
  try {
    const tags = req.query.tags;

    if (!tags) {
      return res.status(400).json({
        success: false,
        message: 'Tags query parameter is required (comma-separated)',
      });
    }

    const tagsArray = tags.split(',').map((tag) => tag.trim());

    const users = await User.find({
      skills: { $in: tagsArray },
      videoIntroUrl: { $exists: true, $ne: '' },
    }).select('fullName email avatar videoIntroUrl skills _id');

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleLikeVideo = async (req, res) => {
  const { userId } = req.body;
  const viewerId = req.decoded._id;

  try {
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    const alreadyLiked = user.likedBy.includes(viewerId);

    if (alreadyLiked) {
      // Unlike
      user.likedBy.pull(viewerId);
      user.videoLikes = user.videoLikes - 1;
    } else {
      // Like
      user.likedBy.push(viewerId);
      user.videoLikes = user.videoLikes + 1;
    }

    await user.save();
    res.status(200).json({ success: true, videoLikes: user.videoLikes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllVideoResumes,
  getVideoResumesByTags,
  incrementVideoResumeView,
  toggleLikeVideo,
};
