module.exports = mongoose => {
  const schema = mongoose.Schema(
    {
      name: { type: String, required: true },
      owner: String,
      vietGapCode: String,
      status: String,
      certifications: [
        {
          name: String,
          code: String,
          issuedBy: String,
          validTo: Date
        }
      ],
      contactInfo: {
        address: String,
        phone: String,
        email: String
      }
    },
    { timestamps: true }
  );

  return mongoose.model("farm", schema);
};