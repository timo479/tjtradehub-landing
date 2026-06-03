"use client";
import { useState } from "react";
import WelcomeScreen from "@/components/WelcomeScreen";

export default function WelcomeDemoClient({ userName }: { userName: string }) {
  const [key, setKey] = useState(0);
  return (
    <WelcomeScreen
      key={key}
      userName={userName}
      onComplete={() => setKey(k => k + 1)}
    />
  );
}
