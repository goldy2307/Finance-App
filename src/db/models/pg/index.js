'use strict';

/**
 * PostgreSQL models via Sequelize.
 * Mirrors the same fields as the Mongoose schemas.
 * Swap DB_DRIVER=pg and these are loaded instead.
 */

const { DataTypes } = require('sequelize');
const { getInstance } = require('../../adapters/pg.adapter');

let models = null;

function getModels() {
  if (models) return models;

  const seq = getInstance();

  // ── USER ─────────────────────────────────────────────────────────────────
  const User = seq.define('User', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName:   { type: DataTypes.STRING(80),  allowNull: false },
    lastName:    { type: DataTypes.STRING(80),  allowNull: false },
    email:       { type: DataTypes.STRING(255), allowNull: false, unique: true },
    phone:       { type: DataTypes.STRING(15),  allowNull: false, unique: true },
    password:    { type: DataTypes.STRING(255), allowNull: false },
    pan:         { type: DataTypes.STRING(10) },
    dateOfBirth: { type: DataTypes.DATEONLY },
    gender:      { type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say') },
    pincode:     { type: DataTypes.STRING(10) },
    role:        { type: DataTypes.ENUM('borrower', 'admin', 'agent'), defaultValue: 'borrower' },
    isVerified:  { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive:    { type: DataTypes.BOOLEAN, defaultValue: true  },
    lastLoginAt: { type: DataTypes.DATE },
  }, { underscored: true, tableName: 'users' });

  // ── LOAN ─────────────────────────────────────────────────────────────────
  const Loan = seq.define('Loan', {
    id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    applicationId:    { type: DataTypes.STRING(30), unique: true },
    userId:           { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    loanType:         { type: DataTypes.ENUM('personal', 'business', 'home', 'education'), allowNull: false },
    principalPaise:   { type: DataTypes.BIGINT, allowNull: false },
    disbursedPaise:   { type: DataTypes.BIGINT, defaultValue: 0 },
    outstandingPaise: { type: DataTypes.BIGINT, defaultValue: 0 },
    interestRatePct:  { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    tenureMonths:     { type: DataTypes.INTEGER, allowNull: false },
    emiPaise:         { type: DataTypes.BIGINT },
    purpose:          { type: DataTypes.STRING(255) },
    status: {
      type: DataTypes.ENUM('pending','under_review','approved','rejected','disbursed','closed','npa'),
      defaultValue: 'pending',
    },
    startDate:           { type: DataTypes.DATEONLY },
    endDate:             { type: DataTypes.DATEONLY },
    nextDueDate:         { type: DataTypes.DATEONLY },
    employmentType:      { type: DataTypes.ENUM('salaried', 'self_employed', 'business') },
    monthlyIncomePaise:  { type: DataTypes.BIGINT },
    rejectionReason:     { type: DataTypes.TEXT },
  }, { underscored: true, tableName: 'loans' });

  // ── TRANSACTION ──────────────────────────────────────────────────────────
  const Transaction = seq.define('Transaction', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    txnId:          { type: DataTypes.STRING(30), unique: true },
    loanId:         { type: DataTypes.UUID, references: { model: 'loans', key: 'id' } },
    userId:         { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
    type:           { type: DataTypes.ENUM('disbursement','emi_payment','prepayment','foreclosure','fee','refund'), allowNull: false },
    amountPaise:    { type: DataTypes.BIGINT, allowNull: false },
    principalPaise: { type: DataTypes.BIGINT, defaultValue: 0 },
    interestPaise:  { type: DataTypes.BIGINT, defaultValue: 0 },
    penaltyPaise:   { type: DataTypes.BIGINT, defaultValue: 0 },
    currency:       { type: DataTypes.STRING(3), defaultValue: 'INR' },
    status:         { type: DataTypes.ENUM('pending','success','failed','reversed'), defaultValue: 'pending' },
    paymentMode:    { type: DataTypes.ENUM('neft','imps','upi','nach','cash','internal') },
    referenceId:    { type: DataTypes.STRING(100) },
    bankName:       { type: DataTypes.STRING(100) },
    dueDate:        { type: DataTypes.DATEONLY },
    processedAt:    { type: DataTypes.DATE },
    description:    { type: DataTypes.TEXT },
  }, { underscored: true, tableName: 'transactions' });

  // ── ACCOUNT ──────────────────────────────────────────────────────────────
  const Account = seq.define('Account', {
    id:                  { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId:              { type: DataTypes.UUID, unique: true, allowNull: false, references: { model: 'users', key: 'id' } },
    totalLoanedPaise:    { type: DataTypes.BIGINT, defaultValue: 0 },
    totalRepaidPaise:    { type: DataTypes.BIGINT, defaultValue: 0 },
    outstandingPaise:    { type: DataTypes.BIGINT, defaultValue: 0 },
    overdueAmountPaise:  { type: DataTypes.BIGINT, defaultValue: 0 },
    activeLoanCount:     { type: DataTypes.INTEGER, defaultValue: 0 },
    closedLoanCount:     { type: DataTypes.INTEGER, defaultValue: 0 },
    creditScore:         { type: DataTypes.INTEGER },
    isBlacklisted:       { type: DataTypes.BOOLEAN, defaultValue: false },
    kycStatus:           { type: DataTypes.ENUM('pending','submitted','verified','rejected'), defaultValue: 'pending' },
    nachMandateActive:   { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { underscored: true, tableName: 'accounts' });

  // ── ASSOCIATIONS ─────────────────────────────────────────────────────────
  User.hasMany(Loan,        { foreignKey: 'userId' });
  Loan.belongsTo(User,      { foreignKey: 'userId' });
  User.hasMany(Transaction, { foreignKey: 'userId' });
  Loan.hasMany(Transaction, { foreignKey: 'loanId' });
  Transaction.belongsTo(Loan, { foreignKey: 'loanId' });
  User.hasOne(Account,      { foreignKey: 'userId' });
  Account.belongsTo(User,   { foreignKey: 'userId' });

  models = { User, Loan, Transaction, Account, sequelize: seq };
  return models;
}

module.exports = { getModels };
