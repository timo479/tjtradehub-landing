"use client";
import { useCallback, useEffect, useState } from "react";
import WelcomeScreen from "./WelcomeScreen";

interface Props {
  userName: string;
  show: boolean;
}

function fireWelcomeDone() {
  try { sessionStorage.setItem("tj-welcome-done", "1"); } catch {}
  window.dispatchEvent(new Event("welcomeDone"));
}

export default function WelcomeWrapper({ userName, show }: Props) {
  const [visible, setVisible] = useState(show);

  // If no welcome to show, signal downstream components immediately
  useEffect(() => {
    if (!show) fireWelcomeDone();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = useCallback(async () => {
    setVisible(false);
    fireWelcomeDone();
    try {
      await fetch("/api/welcome", { method: "POST" });
    } catch {}
  }, []);

  if (!visible) return null;
  return <WelcomeScreen userName={userName} onComplete={handleComplete} />;
}
