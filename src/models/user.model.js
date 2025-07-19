/* -------------------------------------------------------------------------- */
/*                                Dependencies                                */
/* -------------------------------------------------------------------------- */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

/* -------------------------------------------------------------------------- */
/*                                 User Schema                                */
/* -------------------------------------------------------------------------- */

const WorkExperienceItemSchema = new Schema(
  {
    company: String,
    position: String,
    startDate: String,
    endDate: String,
    description: String,
    technologies: [String],
  },
  { _id: false },
);

const EducationItemSchema = new Schema(
  {
    institution: String,
    degree: String,
    fieldOfStudy: String,
    startDate: String,
    endDate: String,
    marks: String,
  },
  { _id: false },
);

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  // Existing fields
  fullName: String,
  photo: String,
  is_active: { type: Boolean, default: true },
  role: { type: String }, // is_manager, is_admin, is_user
  confirmationCode: String,
  resetPasswordToken: String,
  resetPasswordExpires: String,
  joined_at: Date,
  updated_at: Date,
  title: String,

  // New fields
  phone: String,
  location: String,
  portfolio: String,
  linkedin: String,
  github: String,
  bio: String,
  avatar: {type: String, default: null},
  videoIntroUrl: String,
  videoViews: { type: Number, default: 0 }, // Track total views
  videoLikes: { type: Number, default: 0 }, // Total likes count
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Who liked this video
  experience: String,
  availability: String,
  skills: [String],
  workExperience: [WorkExperienceItemSchema],
  education: [EducationItemSchema],
  certifications: [String],
  projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  participationHistory: [
    {
      month: String, // Format: "2025-06"
      projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    },
  ],
});

/* -------------------------------------------------------------------------- */
/*                              PASSWORD HELPERS                              */
/* -------------------------------------------------------------------------- */
/**
 * Encrypt password before saving users objects int database we need to run
 * this encrypt than save it. (pre save)
 */
UserSchema.pre('save', function (next) {
  let user = this;
  if (this.isModified('password') || this.isNew) {
    // generate 10 length random characters
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
      // mix the 10 length random characters with user password => output the hash
      bcrypt.hash(user.password, salt, null, function (err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        // we are done with the operation so let's move on
        next();
      });
    });
  } else {
    return next();
  }
});

/**
 * this function to compare password
 * @param {String} password
 * @returns {boolean}
 */
UserSchema.methods.comparePassword = function (password) {
  let user = this; // this reference the user itself
  return bcrypt.compareSync(password, user.password);
};

// export User Schema
module.exports = mongoose.model('User', UserSchema);
