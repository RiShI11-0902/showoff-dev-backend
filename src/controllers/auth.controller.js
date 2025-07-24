/* -------------------------------------------------------------------------- */
/*                                Dependencies                                */
/* -------------------------------------------------------------------------- */
// Packages
const crypto = require('crypto');

// Models
const User = require('../models/user.model');

// Token
const jwt = require('jsonwebtoken');

// Email Template
const {
  forgotPasswordEmailTemplate,
  resetPasswordConfirmationEmailTemplate,
} = require('../template/userAccountEmailTemplates');

// Helpers
const { sendEmail, FROM_EMAIL, API_ENDPOINT } = require('../utils/helpers');
const { default: axios } = require('axios');

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Sign up a new user
 * @param {Object} req - Request object containing user data
 * @param {Object} res - Response object to send JSON response
 */

const github = (req, res) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:email`;
  res.redirect(redirectUrl);
};

const githubCallback = async (req, res) => {
  const { code } = req.query;

  try {
    // 1. Exchange code for access token
    const tokenResponse = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      },
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Get GitHub user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 3. Get user's primary email
    const emailResponse = await axios.get(
      'https://api.github.com/user/emails',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const primaryEmail = emailResponse.data.find(
      (e) => e.primary && e.verified,
    )?.email;

    const {
      id: githubId,
      login: username,
      avatar_url,
      name,
    } = userResponse.data;

    // 4. Check if user exists in DB
    let user = await User.findOne({ githubId });

    if (!user) {
      user = await User.create({
        githubId,
        email: primaryEmail || `${username}@github.com`,
        fullName: name || username,
        avatar: avatar_url,
        joined_at: new Date(),
        role: 'developer',
        isOAuth: true,
      });
    }

    // 5. Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.SECRET, {
      expiresIn: '7d',
    });

    // 6. Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/github-success?token=${token}`);
  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};

const signUp = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: 'Please Enter Email Password',
      });
    }

    // Check if user with the provided email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already Exists',
      });
    }

    // Create a new user instance
    const newUser = new User({
      isOAuth: false,
      email,
      password,
      confirmationCode: crypto.randomBytes(20).toString('hex'),
      fullName,
      role,
      // photo: req.files?.photo ? req.files.photo[0].path.replace('\\', '/') : '',
      joined_at: new Date(),
    });

    // Save the new user
    await newUser.save();

    // Send confirmation email
    // const template = singUpConfirmationEmailTemplate(
    //   newUser.fullName,
    //   API_ENDPOINT,
    //   newUser.email,
    //   newUser.confirmationCode,
    // );

    // const data = {
    //   from: FROM_EMAIL,
    //   to: newUser.email,
    //   subject: 'Confirmation of your registration on the application.',
    //   html: template,
    // };

    // await sendEmail(data);

    const token = jwt.sign({ id: newUser._id }, process.env.SECRET, {
      expiresIn: '7d', // Token expires in 7 days
    });

    return res.json({
      success: true,
      user: newUser,
      token: token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while registering the user.',
      error: error.message,
    });
  }
};

/**
 * Sign in with an existing account
 * @param {Object} req - Request object containing user credentials
 * @param {Object} res - Response object to send JSON response
 */
const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const foundUser = await User.findOne({ email });

    // If user not found or password doesn't match, return error
    if (!foundUser || !foundUser.comparePassword(password)) {
      return res.status(403).json({
        success: false,
        message: 'Authentication failed, incorrect email or password.',
      });
    }

    // Check if user account is active
    if (!foundUser.is_active) {
      return res.status(405).json({
        success: false,
        message:
          "Votre compte n'est pas activé ! Merci de consulter votre email ou contacter l'équipe",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: foundUser._id }, process.env.SECRET, {
      expiresIn: '7d', // Token expires in 7 days
    });

    // Return success response with token and user information
    return res.json({
      success: true,
      token,
      user: {
        _id: foundUser._id,
        email: foundUser.email,
        fullName: foundUser.fullName,
        role: foundUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication.',
      error: error.message,
    });
  }
};

/**
 * Sign in with an existing account as in admin
 * @param {Object} req - Request object containing user credentials
 * @param {Object} res - Response object to send JSON response
 */
const adminSignIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const foundUser = await User.findOne({ email });

    // If user not found or password doesn't match, return error
    if (!foundUser || !(await foundUser.comparePassword(password))) {
      return res.status(403).json({
        success: false,
        message:
          "Échec de l'authentification, utilisateur introuvable ou mot de passe erroné",
      });
    }

    // Check if user account is active
    if (!foundUser.is_active) {
      return res.status(405).json({
        success: false,
        message:
          "Votre compte n'est pas activé ! Merci de consulter votre email ou contacter l'équipe",
      });
    }

    // Check user role
    const allowedRoles = ['is_admin', 'is_manager'];
    if (!allowedRoles.includes(foundUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à vous connecter",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { ...foundUser.toJSON(), isAdmin: true },
      process.env.SECRET,
      {
        expiresIn: 604800,
      },
    );

    return res.json({
      success: true,
      token,
      // return user information without password field
      user: {
        _id: foundUser._id,
        email: foundUser.email,
        fullName: foundUser.fullName,
        role: foundUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'authentification",
      error: error.message,
    });
  }
};

/**
 * Send email for resetting password
 * @param {Object} req - Request object containing user email
 * @param {Object} res - Response object to send JSON response
 */
const forgotPassword = async (req, res) => {
  try {
    // Find user by email
    const user = await User.findOne({ email: req.body.email });

    // If user not found, return error
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    // Generate random token
    const token = crypto.randomBytes(20).toString('hex');

    // Update user with reset token and expiration time
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Send reset password email
    const template = forgotPasswordEmailTemplate(
      user.fullName,
      user.email,
      API_ENDPOINT,
      token,
    );

    const data = {
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      html: template,
    };

    await sendEmail(data);

    return res.json({
      message: "Veuillez vérifier votre e-mail pour plus d'instructions",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Une erreur est survenue.', error: error.message });
  }
};

/**
 * Reset user password
 * @param {Object} req - Request object containing token and new password
 * @param {Object} res - Response object to send JSON response
 */
const resetPassword = async (req, res) => {
  try {
    // Find user by reset password token and check expiration
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    // If user not found or token expired, return error
    if (!user) {
      return res.status(400).json({
        message:
          'Le jeton de réinitialisation de mot de passe est invalide ou a expiré.',
      });
    }

    // Check if new password matches verification password
    if (req.body.newPassword !== req.body.verifyPassword) {
      return res
        .status(422)
        .json({ message: 'Le mot de passe ne correspondent pas.' });
    }

    // Update user's password and clear reset token fields
    user.password = req.body.newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send password reset confirmation email
    const template = resetPasswordConfirmationEmailTemplate(user.fullName);
    const data = {
      to: user.email,
      from: FROM_EMAIL,
      subject: 'Confirmation de réinitialisation du mot de passe',
      html: template,
    };

    await sendEmail(data);

    return res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Une erreur est survenue.', error: error.message });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({ message: 'User logged out' });
};

module.exports = {
  signUp,
  signIn,
  adminSignIn,
  forgotPassword,
  resetPassword,
  logout,
  github,
  githubCallback,
};
