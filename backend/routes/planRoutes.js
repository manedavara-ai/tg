const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');

router.post('/add', planController.addPlan);
router.get('/get', planController.getPlans);
router.post('/reorder', planController.reorderPlans);
router.put('/edit/:id', planController.editPlan);
router.delete('/delete/:id', planController.deletePlan);
router.get('/:id', planController.getSinglePlan);

module.exports = router;
