const planService = require('../services/planService');

const addPlan = async (req, res) => {
  try {
    const plan = await planService.createPlan(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPlans = async (req, res) => {
  try {
    const plans = await planService.getAllPlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSinglePlan = async (req, res) => {
  try {
    const plan = await planService.getPlanById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const editPlan = async (req, res) => {
  try {
    const updatedPlan = await planService.updatePlan(req.params.id, req.body);
    res.json(updatedPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    await planService.deletePlan(req.params.id);
    res.json({ message: 'Plan deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reorderPlans = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    await planService.reorderPlans(orderedIds);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addPlan,
  getPlans,
  getSinglePlan,
  editPlan,
  deletePlan,
  reorderPlans
};
