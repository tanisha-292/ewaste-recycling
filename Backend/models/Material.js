const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Material name is required'],
      unique: true,
      trim: true,
    },
    symbol: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['precious metal', 'base metal', 'plastic', 'glass', 'other'],
      default: 'other',
    },
   
    pricePerKg: {
      type: Number,
      required: [true, 'Price per kg is required'],
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Material', materialSchema);