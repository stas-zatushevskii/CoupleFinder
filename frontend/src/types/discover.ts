import type { User } from "./user";

export type DiscoverResponse = {
    items: User[];
    nextCursor: string | null;
    hasMore: boolean;
};

export type DiscoverAction = "like" | "skip";