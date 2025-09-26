interface TelegramNotificationParams {
    chatId: number;
    username: string;
    telegramUsername: string;
    queuePattern: string;
    messageNumber?: number;
}
declare class TelegramBotService {
    private bot;
    private isEnabled;
    private botUsername;
    constructor();
    private initializeBot;
    private setupMessageHandlers;
    isServiceEnabled(): boolean;
    getBotUsername(): string;
    getBotInitLink(): string;
    sendQueueNotification(params: TelegramNotificationParams): Promise<boolean>;
    private createQueueNotificationMessage;
    sendSuccessiveNotifications(chatId: number, username: string, telegramUsername: string, queuePattern: string): Promise<void>;
    findUserByChatId(chatId: number): Promise<any | null>;
    linkChatIdToUser(telegramUsername: string, chatId: number): Promise<boolean>;
    testNotification(telegramUsername: string): Promise<boolean>;
    sendWelcomeMessage(telegramUsername: string, chatId: number, username?: string): Promise<boolean>;
    getServiceStatus(): {
        enabled: boolean;
        botUsername: string;
        initLink: string;
    };
}
export declare const telegramBotService: TelegramBotService;
export {};
//# sourceMappingURL=telegramBotService.d.ts.map