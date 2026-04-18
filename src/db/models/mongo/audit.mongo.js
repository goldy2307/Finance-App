'use strict';
const mongoose = require('mongoose');
const s = new mongoose.Schema({
  action:       String,
  actorId:      String,
  actorRole:    String,
  resourceId:   String,
  resourceType: String,
  before:       mongoose.Schema.Types.Mixed,
  after:        mongoose.Schema.Types.Mixed,
  ip:           String,
}, { timestamps: true, versionKey: false });
s.index({ createdAt: -1 });
s.index({ actorRole: 1, action: 1 });
module.exports = mongoose.model('AuditLog', s);