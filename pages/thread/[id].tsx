import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Thread() {
  const router = useRouter();
  const { id } = router.query;
  const [thread, setThread] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [aiReply, setAiReply] = useState("");

  useEffect(() => {
    if (!id) return;
    const storedThreads = localStorage.getItem("threads");
    if (storedThreads) {
      const threads = JSON.parse(storedThreads);
      const t = threads.find((t: any) => t.id === id);
      setThread(t);
    }
  }, [id]);

  const handleSend = async () => {
console.log("[LOG] handleSend 呼び出しスタート");




    if (!thread || !newMessage.trim()) return;

    const updatedThread = {
      ...thread,
      messages: [
        ...thread.messages,
{ role: "user", content: newMessage }

      ],
    };

    setThread(updatedThread);
    setNewMessage("");
const messagesForOpenAI = updatedThread.messages.map(({ role, content }) => ({
  role,
  content,
}));

const response = await fetch("/api/ask", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: messagesForOpenAI }),
});

const data = await response.json();
console.log("[LOG] OpenAI APIからのレスポンス:", JSON.stringify(data, null, 2));


let reply = "";

if (data.error) {
  console.error("[ERROR] OpenAIエラー:", data.error);
  reply = `AIふじたの返事ができませんでした（${data.error.message}）`;
} else {
  reply = data.result || "AIふじたの返事ができませんでした。"; // ← ここが重要！
}


const finalThread = {
  ...updatedThread,
  messages: [
    ...updatedThread.messages,
    { role: "assistant", content: reply },
  ],
};

setThread(finalThread);
setAiReply(reply);

  const storedThreads = localStorage.getItem("threads");
  if (storedThreads) {
    const threads = JSON.parse(storedThreads);
    const updatedThreads = threads.map((t: any) =>
      t.id === id ? finalThread : t
    );
    localStorage.setItem("threads", JSON.stringify(updatedThreads));
  }
};


 

  if (!thread) return <div className="p-4">読み込み中...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">スレッド: {id}</h1>

      <div className="space-y-4 mb-6">
        {thread.messages.map((message: any, index: number) => (
          <div
            key={index}
            className={`p-3 border rounded ${
              message.role === "assistant" ? "bg-gray-100" : "bg-white"
            }`}
          >
            <p className="text-sm text-gray-500">
              {message.role === "assistant" ? "AI藤田" : `${message.name || "匿名"} さん`}:
            </p>
            <p>{message.content}</p>
          </div>
        ))}
      </div>

      <textarea
        className="w-full p-2 border rounded mb-2"
        rows={3}
        placeholder="あなたのメッセージ"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button
        onClick={handleSend}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        送信
      </button>

      <div className="mt-8">
        <button
          onClick={() => (window.location.href = "/")}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          トップページに戻る
        </button>
      </div>
    </div>
  );
}
