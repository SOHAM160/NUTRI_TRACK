import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['Weekly', 'Monthly'],
    required: true
  },
  periodStart: Date,
  periodEnd: Date,
  metrics: {
    avgCalories: Number,
    avgProtein: Number,
    avgCarbs: Number,
    avgFat: Number,
    goalAdherence: Number,
    consistency: Number,
    mostConsumedType: String,
    mostSkippedType: String
  },
  aiInsights: {
    type: String,
    required: true
  }
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);
export default Report;
