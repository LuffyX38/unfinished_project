const appError = require("./../Utils/AppError");

const sendErrorDev = (err, res) => {
  console.log(err);
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.log("Error 💥💥");
    res.status(500).json({
      status: "fail",
      message: "something went wrong",
    });
  }
};

const handleCastErrorDB = () => {
  return new appError("Invalid token, please login again!", 401);
};

const handleDuplicateFieldDB = (err) => {
  let value = Object.values(err.keyValue)[0];
  let message = `Duplicate field value : ${value}, Please use another value!!`;
  return new appError(message, 400);
};

const handleValidationError = (err) => {
  let error = Object.values(err.errors).map((el) => el.message);
  let message = `Invalid input data : ${error.join(`. `)}`;
  return new appError(message, 400);
};

const handleJsonWebTokenError = () => {
  return new appError(`Invalid token, please login again!`, 401);
};

const handleTokenExpiredError = () => {
  return new appError("your token has expired, please login again!", 401);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = Object.assign(err);
    console.log(error.name);
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldDB(error);
    if (error.name === "ValidationError") error = handleValidationError(error);
    if (error.name === "JsonWebTokenError") error = handleJsonWebTokenError();
    if (error.name === "TokenExpiredError") error = handleTokenExpiredError();
    sendErrorProd(error, res);
  }
};
