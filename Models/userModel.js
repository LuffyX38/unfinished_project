const express = require("express");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "please enter your name!!"],
  },
  userName: {
    type: String,
    unique: true,
    required: [true, "Please enter username"],
    maxLength: 20,
    minLength: 3,
  },
  password: {
    type: String,
    required: [true, "please enter password"],
    minLength: [8, "Password size should be greater than 8 characters"],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "please re-type password"],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: "passwords are not same",
    },
  },
  email: {
    type: String,
    unique: true,
    validate: [validator.isEmail, "Please enter a valid email"],
    lowercase: true,
    required: [true, "Please enter your emiail!!"],
  },
  photo: {
    type: String,
  },
  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  role: {
    type: String,
    enum: ["dev", "n_dev"],
    default: "n_dev",
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangeAt = Date.now() - 1000;
  next();
});

userSchema.methods.passwordChangesAfter = function (JWTTimestamp) {
  if (this.passwordChangeAt) {
    let newTime = parseInt(this.passwordChangeAt.getTime() / 1000, 10);
    console.log(JWTTimestamp, newTime);
    return JWTTimestamp < newTime;
  }
  return false;
};

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  let resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
