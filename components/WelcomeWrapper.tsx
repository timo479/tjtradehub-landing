"use client";
import { useCallback, useState } from "react";
import WelcomeScreen from "./WelcomeScreen";

interface Props {
  userName: string;
  show: boolean;
}

export default function WelcomeWrapper({ userName, show }: Props) {
  const [visible, setVisible] = useState(show);

  const handleComplete = useCallback(async () => {
    setVisible(false);
    try {
      await fetch("/api/welcome", { method: "POST" });
    } catch {}
  }, []);

  if (!visible) return null;
  return <WelcomeScreen userName={userName} onComplete={handleComplete} />;
}
