module.exports = mongoose => {
  const schema = mongoose.Schema(
    {
      username: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { 
        type: String, 
        enum: ['Admin', 'FarmOwner', 'User'], 
        default: 'User' 
      },
      // --- Embedding Profile (Theo thiết kế 5.3) ---
      profile: {
        fullName: String,
        phone: String,
        address: String,
        avatar: String
      },
      status: { 
        type: String, 
        enum: ['Active', 'Banned'], 
        default: 'Active' 
      }
    },
    { timestamps: true }
  );
  return mongoose.model("account", schema);
};