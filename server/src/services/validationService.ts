import Joi from 'joi';

export interface UserRegistrationData {
  username: string;
  email: string;
}

export const validateUserRegistration = (data: UserRegistrationData) => {
  const schema = Joi.object({
    username: Joi.string()
      .min(7)
      .max(50)
      .required()
      .messages({
        'string.min': 'Username must be at least 7 characters long',
        'string.max': 'Username cannot exceed 50 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
  });

  return schema.validate(data);
};

export const validateQueueUpdate = (data: any) => {
  const schema = Joi.object({
    currentUserPattern: Joi.string()
      .pattern(/^[a-zA-Z0-9]{4}\.\.[a-zA-Z0-9]{3}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid username pattern format. Expected: abcd..xyz',
        'any.required': 'Current user pattern is required'
      }),
    rawContent: Joi.string().optional(),
    timestamp: Joi.date().optional()
  });

  return schema.validate(data);
};