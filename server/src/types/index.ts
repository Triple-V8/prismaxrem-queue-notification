export interface User {
    id: number;
    username: string;
    email: string;
    positionInQueue: number;
}

export interface Queue {
    id: number;
    users: User[];
    currentUser: User | null;
}