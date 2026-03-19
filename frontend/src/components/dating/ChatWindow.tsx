import type { Message } from "../../types/user";
import { Button } from "../ui/Button";

type Props = {
    messages: Message[];
};

export function ChatWindow({ messages }: Props) {
    return (
        <div className="flex h-[70vh] flex-col rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 p-4">
                <h2 className="text-lg font-semibold text-slate-900">Чат</h2>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((message) => {
                    const isMine = message.senderId === 999;

                    return (
                        <div
                            key={message.id}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${
                                    isMine
                                        ? "bg-pink-500 text-white"
                                        : "bg-slate-100 text-slate-800"
                                }`}
                            >
                                <p>{message.text}</p>
                                <span
                                    className={`mt-2 block text-[11px] ${
                                        isMine ? "text-pink-100" : "text-slate-400"
                                    }`}
                                >
                  {message.createdAt}
                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-4">
                <input
                    placeholder="Введите сообщение..."
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-pink-400"
                />
                <Button>Отправить</Button>
            </div>
        </div>
    );
}