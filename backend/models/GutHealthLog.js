import mongoose from 'mongoose';

const gutHealthLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  logDate: {
    type: Date,
    required: true
  },
  symptoms: [{
    type: {
      type: String,
      enum: ['bloating', 'constipation', 'acidity', 'diarrhea', 'stomach_pain', 'gas', 'nausea', 'none'],
      required: true
    },
    severity: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    }
  }],
  notes: {
    type: String,
    maxLength: 500,
    default: ''
  },
  gutScore: {
    type: Number,
    min: 0,
    max: 100
  },
  metrics: {
    fiberCons: Number,
    probioticCons: Number, // Estimated count of probiotic meals
    prebioticCons: Number // Estimated count of prebiotic meals
  },
  aiInsights: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('GutHealthLog', gutHealthLogSchema);
