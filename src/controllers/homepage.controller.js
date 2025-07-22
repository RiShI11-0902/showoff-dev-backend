const Project = require('../models/project.model');
const userModel = require('../models/user.model');

const getHomePageData = async (req, res) => {
  try {
    const developers = await userModel.countDocuments({ role: 'developer' });
    const projects = await Project.countDocuments();
    const resumes = await userModel.countDocuments({
      videoIntroUrl: {
        $exists: true,
        $nin: ['', null],
      },
    });

    res.status(200).json({
      success: true,
      message: 'Winner declared',
      data: { developers, projects, resumes },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getHomePageData,
};
