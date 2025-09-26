"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQueueUpdate = exports.validateUserRegistration = void 0;
const joi_1 = __importDefault(require("joi"));
const validateUserRegistration = (data) => {
    const schema = joi_1.default.object({
        username: joi_1.default.string()
            .min(7)
            .max(50)
            .required()
            .messages({
            'string.min': 'Username must be at least 7 characters long',
            'string.max': 'Username cannot exceed 50 characters',
            'any.required': 'Username is required'
        }),
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        })
    });
    return schema.validate(data);
};
exports.validateUserRegistration = validateUserRegistration;
const validateQueueUpdate = (data) => {
    const schema = joi_1.default.object({
        currentUserPattern: joi_1.default.string()
            .pattern(/^[a-zA-Z0-9]{4}\.\.[a-zA-Z0-9]{3}$/)
            .required()
            .messages({
            'string.pattern.base': 'Invalid username pattern format. Expected: abcd..xyz',
            'any.required': 'Current user pattern is required'
        }),
        rawContent: joi_1.default.string().optional(),
        timestamp: joi_1.default.date().optional()
    });
    return schema.validate(data);
};
exports.validateQueueUpdate = validateQueueUpdate;
