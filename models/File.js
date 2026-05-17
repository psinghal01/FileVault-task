const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    sha256: {
      type: String,
      required: true,
    },
    occurrenceCount: {
      type: Number,
      default: 1,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    path: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("File", fileSchema);