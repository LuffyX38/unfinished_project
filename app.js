const express = require("express");
const morgan = require("morgan");
const app = express();
const userRouter = require("./Routes/userRoute");
app.use(express.json());
const appError = require('./Utils/AppError');
const globalErrorHandler = require('./Controller/errorController');

app.use("/api/v1/users", userRouter);

app.all('*', (req, res, next) => {
    next(new appError(`error, ${req.originalUrl} not found on the server`, 400));
});

app.use(globalErrorHandler);

module.exports = app;
