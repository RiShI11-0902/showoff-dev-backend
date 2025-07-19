const router = require('express').Router();
const {
  decideWinnerForCurrentMonth,
  getWinner,
  getAllProjects,
} = require('../controllers/winner.controller');

router.post('/', decideWinnerForCurrentMonth);
router.get('/current', getWinner); // ?month=2025-06
router.get('/', getAllProjects);

module.exports = router;
