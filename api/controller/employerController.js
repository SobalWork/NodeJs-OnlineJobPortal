const jwt = require("jsonwebtoken");
const employerModel = require("../models/employerModel");
const userModel = require("../models/userModel");
const { comparePassword } = require("../utils/comparePassword");
const { encryptPassword } = require("../utils/encryptPassword");
const { generateToken } = require("../utils/jwtTokenUtils");
const jobPostingModel = require("../models/jobPostingModel");
const chatModel = require("../models/chatModel");
const applicationModel = require("../models/applicationModel");

const getAllEmployers = async (req, res, next) => {
  try {
    const employerData = await employerModel.find().populate("user");
    if (!employerData) {
      return res.status(404).json({
        message: "get all employer not found",
        email: req.user.email,
      });
    }
    const formattedEmployers = employerData.map((employer) => ({
      employerId: employer._id,
      userId: employer.user._id,
      role: employer.user.role,
      name: employer.user.name,
      email: employer.user.email,
      createdAt: employer.user.createdAt,
      jobPostings: employer.jobPostings,
    }));
    return res.status(200).json({
      message: "get employer",
      data: formattedEmployers,
    });
  } catch (err) {
    console.log(err.message);
    res.status(501).json({
      error: "Internal server error when getting all employer",
    });
  }
};

const getEmployerProfile = async (req, res, next) => {
  console.log(req.body);
  try {
    const userId = req.user.id;
    const employerData = await employerModel
      .findOne({ user: userId })
      .populate("user")
      .populate("jobPostings");
    if (!employerData) {
      return res.status(404).json({
        message: "get employer not found",
        email: req.user.email,
      });
    }

    const formattedJob = {
      employerId: employerData._id,
      userId: employerData.user._id,
      userRole: employerData.user.role,
      userName: employerData.user.name,
      userEmail: employerData.user.email,
      userCreatedAt: employerData.user.createdAt,
      jobPostings: employerData.jobPostings.map((jobPost) => ({
        jobPostId: jobPost._id,
        jobPostTitle: jobPost.title,
      })),
    };

    return res.status(200).json({
      message: "Get employer profile",
      data: formattedJob,
    });
  } catch (err) {
    console.log(err.message);
    res.status(501).json({
      error: "Internal server error when getting employer",
    });
  }
};

const getOneEmployer = async (req, res, next) => {
  console.log(req.params.id);
  try {
    const userId = req.params.id;
    const employerData = await employerModel
      .findById(userId)
      .populate("user")
      .populate("jobPostings");
    if (!employerData) {
      return res.status(404).json({
        message: "Employer not found",
        email: req.params.email,
      });
    }

    const formattedJob = {
      employerId: employerData._id,
      userId: employerData.user._id,
      userRole: employerData.user.role,
      userName: employerData.user.name,
      userEmail: employerData.user.email,
      userCreatedAt: employerData.user.createdAt,
      jobPostings: employerData.jobPostings.map((jobPost) => ({
        jobPostId: jobPost._id,
        jobPostTitle: jobPost.title,
      })),
    };

    return res.status(200).json({
      message: "Get one employer",
      data: formattedJob,
    });
  } catch (err) {
    console.log(err.message);
    res.status(501).json({
      error: "Internal server error when getting one employer",
    });
  }
};

const registerEmployer = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const encryptedPassword = await encryptPassword(password);
    const newUser = new userModel({
      name,
      email,
      password: encryptedPassword,
      role,
    });

    const alreadyExist = await userModel.findOne({
      email,
    });
    if (alreadyExist) {
      return res.status(400).json({
        error: "Employer email already exist",
      });
    }
    const savedUser = await newUser.save();

    const employerData = new employerModel({
      user: savedUser._id,
    });

    const savedEmployer = await employerData.save();
    const populatedEmployer = await employerModel
      .findById(savedEmployer._id)
      .populate("user");

    const token = generateToken({
      id: populatedEmployer.user?._id,
      email: populatedEmployer.user?.email,
      role: populatedEmployer.user?.role,
    });

    return res.status(201).json({
      message: "Registered",
      id: populatedEmployer.user?._id,
      email: populatedEmployer.user?.email,
      role: populatedEmployer.user?.role,
      token,
    });
  } catch (err) {
    console.log(err.message);
    res.status(501).json({
      error: "Internal server error when registering employer",
    });
  }
};

const loginEmployer = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    const employerFound = await userModel.findOne({ email, role: "employer" });
    if (!employerFound) {
      return res.status(400).json({
        message: "Invalid Employer Email",
      });
    }

    const passwordMatch = await comparePassword(
      password,
      employerFound.password
    );
    if (!passwordMatch) {
      return res.status(400).json({
        message: "wrong password employer",
      });
    }
    const token = generateToken({
      id: employerFound._id,
      email: employerFound.email,
      role: employerFound.role,
    });

    return res.status(200).json({
      message: "login employer",
      id: employerFound._id,
      email: employerFound.email,
      role: employerFound.role,
      token,
    });
  } catch (err) {
    console.log(err.message);
    res.status(501).json({
      error: "Internal server error when login job employer",
    });
  }
};

const changePasswordEmployer = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const employerFound = await userModel.findById(userId);

    const passwordsMatch = await comparePassword(
      oldPassword,
      employerFound.password
    );
    if (!passwordsMatch) {
      return res.status(400).json({
        message: "Wrong current password for employer",
      });
    } else {
      const hashedPassword = await encryptPassword(newPassword);

      await userModel.findByIdAndUpdate(userId, { password: hashedPassword });

      return res.status(201).json({
        message: "Password Changed",
      });
    }
  } catch (err) {
    console.log(err.message);
    res
      .status(500)
      .json({ message: "Something went wrong during changing password" });
  }
};

const deleteEmployer = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const authUserId = req.user.id;
    console.log(userId, authUserId);

    if (userId !== authUserId) {
      return res.status(403).json({
        message: "Forbidden: You can only delete your own account",
      });
    }

    const userDeleted = await userModel.findByIdAndDelete(userId);
    if (!userDeleted) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const deleteEmployer = await employerModel.findOneAndDelete({
      user: userId,
    });
    await jobPostingModel.deleteMany({ employer: deleteEmployer._id });
    await chatModel.deleteMany({ employer: deleteEmployer._id });
    await applicationModel.deleteMany({ jobEmployer: deleteEmployer._id });

    return res.status(200).json({
      message: "Employer has been deleted",
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      message: "Internal server error when deleting user",
    });
  }
};

module.exports = {
  getAllEmployers,
  getEmployerProfile,
  getOneEmployer,
  registerEmployer,
  loginEmployer,
  changePasswordEmployer,
  deleteEmployer,
};
