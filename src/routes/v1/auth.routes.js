'use strict';

const router      = require('express').Router();
const ctrl        = require('../../controllers/auth.controller');
const { validate }= require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authLimiter }  = require('../../middlewares/rateLimiter.middleware');
const schemas     = require('../../validators/auth.validator');

// Public
router.post('/register',        authLimiter, validate(schemas.register),        ctrl.register);
router.post('/login',           authLimiter, validate(schemas.login),           ctrl.login);
router.post('/refresh',                      validate(schemas.refreshToken),     ctrl.refresh);

// Authenticated
router.get('/me',               authenticate,                                   ctrl.getMe);
router.patch('/me',             authenticate, validate(schemas.updateProfile),  ctrl.updateMe);
router.post('/change-password', authenticate, validate(schemas.changePassword), ctrl.changePassword);
router.post('/logout',          authenticate,                                   ctrl.logout);

module.exports = router;