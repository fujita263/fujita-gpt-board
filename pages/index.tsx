import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type Message = {
  role: "user" | "assistant";
  content: string;
  name?: string;
};

type ThreadType = {
  id: string;
  messages: Message[];
};

export default function Home() {
  const [name, setName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [threads, setThreads] = useState<ThreadType[]>([]); // 型をThreadType[]に指定
  const router = useRouter();

  useEffect(() => {
    const storedThreads = localStorage.getItem("threads");
    if (storedThreads) {
      setThreads(JSON.parse(storedThreads));
    }
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    const id = Math.random().toString(36).substring(2, 10);

    // 表示用には name を保存
    const newThread: ThreadType = {
      id,
      messages: [
        {
          role: "user",
          content: message,
          name: name || "匿名", // ← localStorage用には残す
        },
      ],
    };

    const updatedThreads = [newThread, ...threads];
    setThreads(updatedThreads);
    localStorage.setItem("threads", JSON.stringify(updatedThreads));

    // OpenAI用の messages（nameを除外）
    const messagesForOpenAI = [
      {
        role: "user",
        content: message,
      },
    ];

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesForOpenAI }),
      });

      const data = await res.json();
      let reply = "";

      if (data.error) {
        console.error("OpenAIエラー:", data.error);
        reply = `AIふじたの返事ができませんでした（${data.error.message}）`;
      } else {
        reply = data.result || "AIふじたの返事ができませんでした。";
      }

      const finalThread: ThreadType = {
        ...newThread,
        messages: [...newThread.messages, { role: "assistant", content: reply }],
      };

      const latestThreads = [finalThread, ...threads];
      setThreads(latestThreads);
      localStorage.setItem("threads", JSON.stringify(latestThreads));

      router.push(`/thread/${id}`);
    } catch (e) {
      console.error("AI応答エラー:", e);
      router.push(`/thread/${id}`);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">藤田GPT掲示板</h1>

      <div className="mb-6 p-4 border rounded">
        <p className="mb-2">名前（省略可）</p>
        <input
          type="text"
          className="w-full p-2 border rounded mb-4"
          placeholder="例: ふじた"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="mb-2">悩みを書いてください</p>
        <textarea
          className="w-full p-2 border rounded mb-4"
          rows={4}
          placeholder="例: 強もみが好きな方への対応どうしたら…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          投稿
        </button>
      </div>

      <h2 className="text-xl font-bold mb-2">スレッド一覧</h2>
      <ul className="space-y-2">
        {threads.map((thread) => (
          <li key={thread.id}>
            <a
              href={`/thread/${thread.id}`}
              className="block p-3 border rounded hover:bg-gray-100"
            >
              <p className="text-sm text-gray-500">
                {thread.messages[0]?.name || "匿名"} さん
              </p>
              <p className="text-gray-800">{thread.messages[0]?.content}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
