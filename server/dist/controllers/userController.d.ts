import { Request, Response } from 'express';
declare class UserController {
    private generateUsernamePattern;
    registerUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    private validateTelegramUsername;
    getUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getAllUsers: (req: Request, res: Response) => Promise<void>;
    findByUsernamePattern: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    findByEmail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateNotificationStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    testTelegram: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getTelegramStatus: (req: Request, res: Response) => Promise<void>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=userController.d.ts.map