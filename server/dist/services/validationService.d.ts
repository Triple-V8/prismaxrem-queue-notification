import Joi from 'joi';
export interface UserRegistrationData {
    username: string;
    email: string;
}
export declare const validateUserRegistration: (data: UserRegistrationData) => Joi.ValidationResult<any>;
export declare const validateQueueUpdate: (data: any) => Joi.ValidationResult<any>;
//# sourceMappingURL=validationService.d.ts.map