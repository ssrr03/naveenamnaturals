const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const reviewAuth = require("../middlewares/reviewAuth.middleware");

// Handle preflight OPTIONS requests for PATCH
router.options("/:id/approve", (req, res) => {
  res.set({
    "Access-Control-Allow-Origin": req.get("Origin") || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Origin, X-Requested-With, Accept",
    "Access-Control-Allow-Credentials": "true",
  });
  res.sendStatus(200);
});

// Public routes
router.get("/", reviewController.getAllReviews);
router.get("/product/:productId", reviewController.getProductReviews);

// Customer/admin authenticated route (customers submit; admins can add directly from dashboard)
router.post("/", reviewAuth.authenticateReviewCreator, reviewController.createReview);

// Admin-protected routes
router.use(authMiddleware.authenticateToken);
router.get("/stats", reviewController.getReviewStats);
router.get("/:id", reviewController.getReviewById);
router.patch("/:id/approve", reviewController.updateReviewApproval);
router.delete("/:id", reviewController.deleteReview);

module.exports = router;
