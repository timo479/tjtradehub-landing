import { auth } from "@/lib/auth";
import WelcomeDemoClient from "./WelcomeDemoClient";

export default async function WelcomeDemoPage() {
  const session = await auth();
  const name = session?.user?.name ?? "Timo";
  return <WelcomeDemoClient userName={name} />;
}
