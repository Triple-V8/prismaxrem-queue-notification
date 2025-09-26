import { Request, Response } from 'express';
export declare class QueueController {
    private notificationService;
    constructor();
    updateQueueStatus(req: Request, res: Response): Promise<Response | void>;
    getCurrentQueueStatus(req: Request, res: Response): Promise<Response | void>;
    getQueueHistory(req: Request, res: Response): Promise<Response | void>;
    resetNotifications(req: Request, res: Response): Promise<Response | void>;
}
//# sourceMappingURL=queueController.d.ts.map