const mongoose = require('mongoose');

const stalkSchema = new mongoose.Schema(
  {
    stalker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['user', 'establishment'], required: true, index: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    establishmentKey: { type: String, trim: true, lowercase: true, index: true },
    establishmentName: { type: String, trim: true },
    establishmentCity: { type: String, trim: true },
  },
  { timestamps: true }
);

stalkSchema.index({ stalker: 1, targetType: 1, targetUser: 1 }, { unique: true, partialFilterExpression: { targetType: 'user' } });
stalkSchema.index({ stalker: 1, targetType: 1, establishmentKey: 1 }, { unique: true, partialFilterExpression: { targetType: 'establishment' } });

module.exports = mongoose.model('Stalk', stalkSchema);
