module.exports = mongoose => {
  const schema = mongoose.Schema(
    {
      action: { type: String, required: true },
      entity: { type: String, required: true },
      entityId: { type: String, required: true }, // Có thể là String hoặc ObjectId
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts' },
      details: Object, 
      // --------------------
      
      timestamp: { type: Date, default: Date.now }
    },
    { timestamps: true }
  );

  return mongoose.model("auditlog", schema);
};