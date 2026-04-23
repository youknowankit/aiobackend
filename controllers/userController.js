import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyEmail } from "../email/verifyEmail.js";
import { Session } from "../models/sessionModel.js";
import { sendOTPMail } from "../email/sendOTPMail.js";
import cloudinary from "../utils/cloudinary.js";

//REGISTER USER
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    //check if anything is missing while registering
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //check if user already exists in the database
    const user = await User.findOne({ email });
    if (user) {
      res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    //Hashing for password using bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    //Now, we create user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    //Generating TOKEN
    const token = jwt.sign({ id: newUser._id }, process.env.SECRET_KEY, {
      expiresIn: "10m",
    });

    //Send the verification Email
    verifyEmail(token, newUser.email);

    //We pass token to the new user
    newUser.token = token;

    await newUser.save();

    //return success response as well as the newUser created in the database
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//VERIFY USER
export const verify = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(400).json({
        success: false,
        message: "Auth token is missing or invalid",
      });
    }

    /*AuthHeader looks like 
    "[Bearer asds23adasdasd....]-Array" 
    index=0=>Bearer 
    index=1 =>token(asds23adasdasd....)
    
    So, basically we are extracting a token
    */
    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(400).json({
          success: false,
          message: "The registration token has expired",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Token Verification failed",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    user.token = null;
    user.isVerified = true;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//RE-VERIFY USER
export const reVerify = async (req, res) => {
  try {
    const { email } = req.body;

    //Find user in database
    const user = await User.findOne({ email });

    //Handle usernot found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    //Generate the token again send email, provide new token to user in DB and save
    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "10m",
    });
    verifyEmail(token, email); //sends email for verification again
    user.token = token;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Verification Email resent successfully!",
      token: user.token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //check for missing details
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //check if user exists in the database
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User does not exist",
      });
    }

    //check password is valid or not
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password,
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //Check if password valid but user not verified
    if (existingUser.isVerified === false) {
      res.status(400).json({
        success: false,
        message: "Verify account and then login",
      });
    }

    //Generate access token and reference token
    const accessToken = jwt.sign(
      { id: existingUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "10d" },
    );

    const refreshToken = jwt.sign(
      { id: existingUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "30d" },
    );

    existingUser.isLoggedIn = true;
    await existingUser.save();

    //check for existing session if it exists then delete it
    const existingSession = await Session.findOne({ userId: existingUser._id });
    if (existingSession) {
      await Session.deleteOne({ userId: existingUser._id });
    }

    //create a new session for user
    await Session.create({ userId: existingUser._id });
    return res.status(200).json({
      success: true,
      message: `Welcome back ${existingUser.firstName}!`,
      user: existingUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

//LOGOUT
export const logout = async (req, res) => {
  try {
    //We are getting userId from req.id which we assigned in middleware
    const userId = req.id;
    await Session.deleteMany({ userId: userId });
    await User.findByIdAndUpdate(userId, { isLoggedIn: false });
    return res.status(200).json({
      success: true,
      message: "You are successfully logged out!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    //If User exists then generate an OTP an send an Email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); //10 min expiry

    user.otp = otp;
    user.otpExpiry = otpExpiry;

    await user.save();

    await sendOTPMail(otp, email);

    return res.status(200).json({
      success: true,
      message: "OTP sent to email successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//VERIFY OTP
export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.params.email;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP is not generated or already verified",
      });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP Expired. Please request a new OTP.",
      });
    }

    if (otp !== user.otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid.",
      });
    }

    user.otp = null;
    user.optExpiry = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    //To change password we need new password and confirm password
    const { newPassword, confirmPassword } = req.body;
    const { email } = req.params;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (!newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: "Password donot match",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//GET ALL USERS | ADMIN ONLY
export const allUser = async (_, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select(
      "-password -otp -otpExpiry -token",
    ); //removes what not to show

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const userIdToUpdate = req.params.id;

    //This will come from isAuthenticated middleware which we will put in the route
    const loggedUser = req.user;
    const { firstName, lastName, address, city, zipCode, phoneNo, role } =
      req.body;

    //What if some another authenticated user tries to update another users profile?
    //This ensures either user or admin updates the profile
    if (
      loggedUser._id.toString() !== userIdToUpdate &&
      loggedUser.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this profile",
      });
    }

    //find the user in DB to update
    let user = await User.findById(userIdToUpdate);
    //check for found user
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let profilePicUrl = user.profilePic;
    let profilePicPublicId = user.profilePicPublicId;

    //If a new file is uploaded
    if (req.file) {
      if (profilePicPublicId) {
        await cloudinary.uploader.destroy(profilePicPublicId);
      }

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profiles" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(req.file.buffer);
      });

      // console.log(uploadResult, uploadResult.secure_url);

      profilePicUrl = uploadResult.secure_url;
      profilePicPublicId = uploadResult.public_id;
    }

    //update fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.address = address || user.address;
    user.city = city || user.city;
    user.zipCode = zipCode || user.zipCode;
    user.phoneNo = phoneNo || user.phoneNo;
    user.role = role;
    user.profilePic = profilePicUrl;
    user.profilePicPublicId = profilePicPublicId;

    const updateUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully!",
      user: updateUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
