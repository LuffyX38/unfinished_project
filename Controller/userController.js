const User = require("./../Models/userModel");

exports.createUser = async (req, res) => {
  try {
    const createdUser = await User.create(req.body);
    res.status(200).json({
      status: "success",
      data: {
        createdUser,
      },
    });
  } catch (err) {
    res.status(404).json({
      data: {
        err,
      },
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-confirmPassword");
    res.status(200).json({
      status: "success",
      data: {
        users,
      },
    });
  } catch (err) {
    res.status(404).json({
      data: {
        err,
      },
    });
  }
};
