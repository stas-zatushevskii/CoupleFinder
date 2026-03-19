import type { Match, Message, User } from "../types/user";

export const mockUsers: User[] = [
    {
        id: 1,
        name: "Anna",
        age: 24,
        city: "Chisinau",
        bio: "Люблю прогулки, музыку и хорошие разговоры.",
        interests: ["music", "travel", "coffee"],
        avatar: "https://i.pravatar.cc/300?img=32",
    },
    {
        id: 2,
        name: "Elena",
        age: 27,
        city: "Balti",
        bio: "Ценю искренность, юмор и уютные вечера.",
        interests: ["books", "cinema", "yoga"],
        avatar: "https://i.pravatar.cc/300?img=47",
    },
    {
        id: 3,
        name: "Maria",
        age: 22,
        city: "Chisinau",
        bio: "Ищу интересное общение и новые знакомства.",
        interests: ["art", "fitness", "travel"],
        avatar: "https://i.pravatar.cc/300?img=44",
    },
];

export const mockMatches: Match[] = [
    {
        id: 1,
        user: mockUsers[0],
        lastMessage: "Привет, как проходит день?",
    },
    {
        id: 2,
        user: mockUsers[1],
        lastMessage: "Давай познакомимся поближе 🙂",
    },
];

export const mockMessages: Message[] = [
    {
        id: 1,
        senderId: 1,
        text: "Привет!",
        createdAt: "10:20",
    },
    {
        id: 2,
        senderId: 999,
        text: "Привет, рад знакомству :)",
        createdAt: "10:21",
    },
    {
        id: 3,
        senderId: 1,
        text: "Чем любишь заниматься в свободное время?",
        createdAt: "10:22",
    },
];