/* -------------------------------------------------------------------------- */
/*                                Dependencies                                */
/* -------------------------------------------------------------------------- */
const Project = require('../models/project.model');
const User = require('../models/user.model');

/* -------------------------------------------------------------------------- */
/*                               Project Controller                           */
/* -------------------------------------------------------------------------- */

/**
 * Create a new project for a user
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const createProject = async (req, res) => {
  try {
    const { title, description, link, technologies, isCompeting } = req.body;
    // console.log({ title, description, link, technologies });

    const userId = req.decoded._id;
    // console.log(userId);

    const currentMonth = new Date().toISOString().slice(0, 7); // "2025-06"

    const newProject = new Project({
      user: userId,
      title,
      description,
      link: link || [],
      isCompeting: isCompeting || false,
      submittedMonth: currentMonth,
      technologies: technologies || [],
    });

    const savedProject = await newProject.save();

    // Optional: Add project reference to user
    await User.findByIdAndUpdate(userId, {
      $push: { projects: savedProject._id },
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: savedProject,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all submitted projects (public)
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getAllProjects = async (req, res) => {
  try {
    const { month, isCompeting } = req.query;

    const filter = {};
    if (month) filter.submittedMonth = month;
    if (typeof isCompeting === 'boolean') filter.isCompeting = isCompeting;

    const projects = await Project.find(filter).populate(
      'user',
      'fullName email avatar github',
    );
    res.status(200).json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all projects submitted by a specific user
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getUserProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const projects = await Project.find({ user: userId }).populate(
      'user',
      '_id fullName avatar github ',
    );
    res.status(200).json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a specific project by ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate(
      'user',
      'fullName avatar _id github',
    );
    res.status(project ? 200 : 404).json({
      success: !!project,
      message: project ? 'Project found' : 'Project not found',
      project,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a user's project
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.decoded._id;

    const project = await Project.findOne({ _id: projectId, user: userId });
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this project',
      });
    }

    const updated = await Project.findByIdAndUpdate(projectId, req.body, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a user's project
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.decoded._id;

    const project = await Project.findOne({ _id: projectId, user: userId });
    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this project',
      });
    }

    await Project.findByIdAndDelete(projectId);

    // Remove reference from user (optional)
    await User.findByIdAndUpdate(userId, {
      $pull: { projects: projectId },
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      projectId: projectId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Vote a project (increment vote count)
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const voteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.decoded._id; // Get the logged-in user's ID
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: 'Project not found' });
    }

    // Optional: Only allow votes if project is competing this month
    if (!project.isCompeting || project.submittedMonth !== currentMonth) {
      return res.status(403).json({
        success: false,
        message: "Voting is only allowed for this month's competing projects",
      });
    }

    // Check if user has already voted this month
    const hasVoted = project.voters.some(
      (voter) =>
        voter.userId.toString() === userId && voter.month === currentMonth,
    );

    if (hasVoted) {
      project.voters.pull({ userId: userId, month: currentMonth });
      project.votes -= 1;
      await project.save();
      return res.status(200).json({
        success: true,
        message: 'You have unvoted this project',
      });
    }

    // Add user to voters list and increment vote count
    project.votes += 1;
    project.voters.push({ userId, month: currentMonth });
    await project.save();

    res
      .status(200)
      .json({ success: true, message: 'Vote recorded', votes: project.votes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Submit a project for competetion
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */

const submitProjectForCompetition = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.decoded._id;
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: 'Project not found' });
    }

    if (project.user.toString() !== userId) {
      return res
        .status(403)
        .json({ success: false, message: 'Not your project' });
    }

    if (project.submittedMonth === currentMonth) {
      return res
        .status(400)
        .json({ success: false, message: 'Already submitted for this month' });
    }

    // Update for new month competition
    project.votes = 0;
    project.voters = [];
    project.submittedMonth = currentMonth;
    project.isCompeting = true;
    await project.save();

    res.status(200).json({
      success: true,
      message: "Project submitted for this month's competition",
      project,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------------------------------------------------- */
/*                               Export Functions                             */
/* -------------------------------------------------------------------------- */
module.exports = {
  createProject,
  getAllProjects,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  voteProject,
  submitProjectForCompetition,
};
