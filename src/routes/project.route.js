const express = require('express');
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  voteProject,
  submitProjectForCompetition,
} = require('../controllers/project.controller');
const verifyToken = require('../middlewares/verify-token');

// Public routes
router.get('/', getAllProjects);
router.get('/user/:userId', getUserProjects);
router.get('/:projectId', getProjectById);

// Authenticated routes
router.post('/:projectId/submit', verifyToken, submitProjectForCompetition);
router.post('/:projectId/vote', verifyToken, voteProject);
router.post('/', verifyToken, createProject);
router.put('/:projectId', verifyToken, updateProject);
router.delete('/:projectId', verifyToken, deleteProject);

module.exports = router;
