import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In – TJ TradeHub",
  description: "Sign in to your TJ TradeHub account.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your trading journal."
    >
      <LoginForm />
    </AuthLayout>
  );
}
