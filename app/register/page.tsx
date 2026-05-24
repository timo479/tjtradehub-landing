import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Sign Up Free – TJ TradeHub",
  description: "Create your free TJ TradeHub account. Free trading journal, forever — no credit card required.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your free account"
      subtitle="Free trading journal, forever. No credit card required."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
