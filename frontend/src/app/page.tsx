"use client";

import { useState, useEffect } from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          윤호와 우리 가족 기록 공간
        </h1>

        <p className="mb-8 text-gray-600">
          오늘 있었던 일, 컨디션, 특별한 순간을 기록해보세요.
        </p>

        <RecordSection />
      </div>
    </div>
  );
}

function RecordSection() {
  const [text, setText] = useState("");
  const [records, setRecords] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("records");
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("records", JSON.stringify(records));
  }, [records]);

  const save = () => {
    if (!text.trim()) return;
    setRecords([text, ...records]);
    setText("");
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="border p-2 flex-1 rounded"
          placeholder="오늘 있었던 일 한 줄로 적기"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={save}
          className="bg-black text-white px-4 rounded"
        >
          저장
        </button>
      </div>

      <div className="space-y-2">
        {records.map((r, i) => (
          <div key={i} className="p-3 border rounded bg-white">
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}
