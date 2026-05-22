const express = require("express");
const router = express.Router();
const comboController = require("../controllers/combo.controller");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");

// ✅ Public Routes
router.get("/combos", comboController.getPublicCombos);
router.get("/combos/slug/:slug", comboController.getComboBySlug);

// ✅ Admin Routes (Authenticated & Authorized)
router.post("/admin/combos", authenticate, authorize("admin"), comboController.createCombo);
router.get("/admin/combos", authenticate, authorize("admin"), comboController.getAllCombos);
router.get("/admin/combos/:id", authenticate, authorize("admin"), comboController.getComboById);
router.put("/admin/combos/:id", authenticate, authorize("admin"), comboController.updateCombo);
router.delete("/admin/combos/:id", authenticate, authorize("admin"), comboController.deleteCombo);

module.exports = router;
