export type User = {
    id: number;
    name: string;
    age: number;
    city: string;
    bio: string;
    interests: string[];
    avatar: string;
};

export type Message = {
    id: number;
    senderId: number;
    text: string;
    createdAt: string;
};

export type Match = {
    id: number;
    user: User;
    lastMessage?: string;
};