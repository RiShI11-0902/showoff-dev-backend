const Project = require('../models/project.model');
const ProjectOfTheMonth = require('../models/projectOfTheMonth.model');

const decideWinnerForCurrentMonth = async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const existingWinner = await ProjectOfTheMonth.findOne({
      month: currentMonth,
    });
    if (existingWinner) {
      return res.status(400).json({
        success: false,
        message: 'Winner already declared for this month',
      });
    }

    const winner = await Project.findOne({
      submittedMonth: currentMonth,
      isCompeting: true,
    })
      .sort({ votes: -1 })
      .populate('user', 'fullName email photo linkedin github bio');

    if (!winner) {
      return res
        .status(404)
        .json({ success: false, message: 'No competing projects this month' });
    }

    const record = new ProjectOfTheMonth({
      month: currentMonth,
      winnerProject: winner._id,
    });

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Winner declared',
      winner: winner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const { month } = req.query;

    const filter = month ? { month: month } : {}; // if no month, return all projects

    const projects = await ProjectOfTheMonth.find(filter).populate(
      'winnerProject',
    );

    res.status(200).json({ success: true, winners: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWinner = async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Check if winner is already selected
    const existingWinner = await ProjectOfTheMonth.findOne({
      month: currentMonth,
    }).populate({
      path: 'winnerProject',
      populate: {
        path: 'user',
        select: 'fullName email avatar github',
      },
    });

    if (existingWinner) {
      return res.status(200).json({ success: true, winner: existingWinner });
    }

    // If no winner, get top 3 projects of current month by votes
    const topProjects = await Project.find({ submittedMonth: currentMonth })
      .sort({ votes: -1 })
      .limit(3)
      .populate('user', 'fullName email avatar github');

    return res.status(200).json({ success: true, topProjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  decideWinnerForCurrentMonth,
  getAllProjects,
  getWinner,
};
