const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillsprint';

const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  password: String,
  profileSetupComplete: Boolean,
  role: String,
  skills: [String],
  goals: [String],
  customVideoLinks: Array,
  userModuleVideos: Object,
  textNotes: Array,
  sketches: Array,
  dailyPlans: Object,
  submittedFeedback: Array
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@skillsprint.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      id: Date.now().toString(),
      name: 'Admin User',
      email: 'admin@skillsprint.com',
      password: hashedPassword,
      profileSetupComplete: true,
      role: 'admin',
      avatarUrl: '',
      points: 1000,
      earnedBadges: [],
      enrolledCourses: [],      learningPreferences: {
        tracks: ['management'],
        language: 'english'
      },
      customVideoLinks: [],
      userModuleVideos: {},
      textNotes: [],
      sketches: [],
      dailyPlans: {},
      submittedFeedback: []
    });    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@skillsprint.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdminUser();
