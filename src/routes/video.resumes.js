const router = require('express').Router();

const {
  getAllVideoResumes,
  getVideoResumesByTags,
  incrementVideoResumeView,
  toggleLikeVideo,
} = require('../controllers/resumes.controller');
const verifyToken = require('../middlewares/verify-token');

router.get('/video-resumes', getAllVideoResumes);
router.get('/video-resumes/by-tag', getVideoResumesByTags);
router.post('/video-resumes/:userId/view', incrementVideoResumeView);
router.post('/video-resumes/like', verifyToken, toggleLikeVideo);

module.exports = router;
