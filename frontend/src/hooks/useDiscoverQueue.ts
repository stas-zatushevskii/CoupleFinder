import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "../types/user";
import { fetchDiscoverBatch, sendDiscoverAction } from "../services/discover-mock-api";
import type { DiscoverAction } from "../types/discover";

const BATCH_SIZE = 20;
const PREFETCH_THRESHOLD = 10;

export function useDiscoverQueue() {
    const [queue, setQueue] = useState<User[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [bootstrapped, setBootstrapped] = useState(false);

    const unseenCount = queue.length - currentIndex;

    const currentUser = useMemo(() => {
        return queue[currentIndex] ?? null;
    }, [queue, currentIndex]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);

        try {
            const data = await fetchDiscoverBatch(BATCH_SIZE, nextCursor);

            setQueue((prev) => {
                const existingIds = new Set(prev.map((item) => item.id));
                const uniqueNewItems = data.items.filter((item) => !existingIds.has(item.id));
                return [...prev, ...uniqueNewItems];
            });

            setNextCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } finally {
            setLoading(false);
            setBootstrapped(true);
        }
    }, [loading, hasMore, nextCursor]);

    useEffect(() => {
        void loadMore();
    }, [loadMore]);

    useEffect(() => {
        if (bootstrapped && unseenCount < PREFETCH_THRESHOLD && hasMore && !loading) {
            void loadMore();
        }
    }, [bootstrapped, unseenCount, hasMore, loading, loadMore]);

    const trimViewed = useCallback(() => {
        setQueue((prev) => {
            if (currentIndex < 30) return prev;
            return prev.slice(currentIndex);
        });

        setCurrentIndex((prev) => {
            if (prev < 30) return prev;
            return 0;
        });
    }, [currentIndex]);

    const act = useCallback(
        async (action: DiscoverAction) => {
            const user = queue[currentIndex];
            if (!user) return;

            await sendDiscoverAction(user.id, action);
            setCurrentIndex((prev) => prev + 1);
        },
        [queue, currentIndex],
    );

    useEffect(() => {
        trimViewed();
    }, [currentIndex, trimViewed]);

    const like = useCallback(async () => {
        await act("like");
    }, [act]);

    const skip = useCallback(async () => {
        await act("skip");
    }, [act]);

    return {
        currentUser,
        like,
        skip,
        loading,
        hasMore,
        unseenCount,
        isEmpty: !currentUser && !loading,
    };
}