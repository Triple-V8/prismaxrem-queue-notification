export declare class NotificationService {
    private resend;
    constructor();
    sendQueueNotification(email: string, username: string, usernamePattern: string): Promise<void>;
    sendWelcomeEmail(email: string, username: string, usernamePattern: string): Promise<void>;
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=notificationService.d.ts.map