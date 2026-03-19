import { useParams } from "react-router-dom";
import { mockMessages, mockUsers } from "../data/mockUsers";
import { ChatWindow } from "../components/dating/ChatWindow";

export function ChatPage() {
    const { id } = useParams();
    const user = mockUsers.find((item) => item.id === Number(id));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="h-14 w-14 rounded-full object-cover"
                />
                <div>
                    <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
                    <p className="text-sm text-slate-500">{user?.city}</p>
                </div>
            </div>

            <ChatWindow messages={mockMessages} />
        </div>
    );
}