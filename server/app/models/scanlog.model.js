module.exports = mongoose => {
  const schema = mongoose.Schema(
    {
      // Ai quét? (Nullable)
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'account' },
      
      // Quét cái gì? (Index để đếm nhanh)
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'product',
        required: true 
      },

      // Môi trường
      ipAddress: String,
      deviceInfo: String,
      location: String,
      
      timestamp: { type: Date, default: Date.now, index: true } // Time-series Index
    }
  );
  return mongoose.model("scanlog", schema);
};