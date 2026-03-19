import { discoverMockUsers } from "../data/discoverMock";
import type { DiscoverAction, DiscoverResponse } from "../types/discover";

const NETWORK_DELAY_MS = 400;
const DEFAULT_LIMIT = 20;

const viewedUserIds = new Set<number>();

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchDiscoverBatch(
    limit = DEFAULT_LIMIT,
    cursor?: string | null,
): Promise<DiscoverResponse> {
    await sleep(NETWORK_DELAY_MS);

    const startIndex = cursor ? Number(cursor) : 0;

    const available = discoverMockUsers.filter((user) => !viewedUserIds.has(user.id));

    const items = available.slice(startIndex, startIndex + limit);
    const nextIndex = startIndex + items.length;
    const hasMore = nextIndex < available.length;

    return {
        items,
        nextCursor: hasMore ? String(nextIndex) : null,
        hasMore,
    };
}

export async function sendDiscoverAction(
    targetUserId: number,
    action: DiscoverAction,
): Promise<void> {
    await sleep(150);

    viewedUserIds.add(targetUserId);

    console.log("discover action:", {
        targetUserId,
        action,
    });
}

export function resetDiscoverMockState() {
    viewedUserIds.clear();
}