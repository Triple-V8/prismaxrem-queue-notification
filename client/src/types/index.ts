export interface User {
    id: number;
    username: string;
    email: string;
    positionInQueue: number;
    usernamePattern?: string;
    isActive?: boolean;
    notified?: boolean;
    createdAt?: string;
    telegramUsername?: string;
    telegramChatId?: number;
}

export interface RegisterUserData {
    username: string;
    email: string;
    telegramUsername?: string;
}

export interface RegisterUserResponse {
    success: boolean;
    message: string;
    user: {
        id: number;
        username: string;
        usernamePattern: string;
        email: string;
        isActive: boolean;
        createdAt: string;
        telegramUsername?: string;
    };
}

export interface TelegramBotInfo {
    botUsername: string;
    botLink: string;
    isActive: boolean;
}

export interface Queue {
    id: number;
    users: User[];
    currentUser: User | null;
}

export interface QueueStatus {
    currentUserPattern?: string;
    rawContent?: string;
    timestamp?: string;
    nextUser?: string | null;
    position?: number;
    totalUsers?: number;
}