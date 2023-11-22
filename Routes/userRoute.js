const express = require("express");
const router = express.Router();
const userController = require("./../Controller/userController");
const authController = require('./../Controller/authController');

router.route("/create").post(userController.createUser);
router.route("/showUsers").get(authController.protect,authController.restrictTo('dev'),userController.getAllUsers);
router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);
router.route('/forgotPassword').post(authController.protect, authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

module.exports = router;