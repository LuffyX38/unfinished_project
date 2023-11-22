const User = require("./../Models/userModel");
const jwt = require("jsonwebtoken");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/AppError");
const sendEmail = require("./../Utils/email");
const util = require("util");
const crypto = require("crypto");

const createSendToken = catchAsync(async (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOption = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOption.secure = true;

  res.cookie("jwt", token, cookieOption);
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    userName: req.body.userName,
    name: req.body.name,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    email: req.body.email,
    passwordChangeAt: req.body.passwordChangeAt,
    role:req.body.role
  });
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
    user,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("please provide email and password!", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(`Incorrect email or password`, 401));
  }
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
    user,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("your not loged in! please log in to get access 💥", 401)
    );
  }

  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError("user belonging to this token does not exist anymore! ", 401)
    );
  }

  if (freshUser.passwordChangesAfter(decoded.iat)) {
    return next(
      new AppError(
        "user recently changed the password!, please login again ",
        401
      )
    );
  }
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("you do not have permission to perform this action!", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
  });

  if (!user) {
    return next(new AppError("wrong email", 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `forgot your password? submit a patch request with your new password to : ${resetURL}.\n if you didn't forgot your password, please ignore the message`;

  try {
    await sendEmail({
      email: user.email,
      subject: "your password reset token(valid for only 10 minutes)",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(
      new AppError(
        "there was an error sending the email, try again later!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  console.log("hased : " + hashedToken);

  if (!user) {
    return next(new AppError("token is invalid or expired", 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();
  createSendToken(user, 200, res);
});

//***** */
exports.passwordUpdate = catchAsync(async (req, res,next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!user || !(await user.correctPassword(req.body.current_password, user.password))) {
    return next(new AppError('incorrect password',401));
  }

  user.password = req.body.new_password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  console.log(user);
  createSendToken(user, 200, res);

})