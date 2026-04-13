import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Start Free Trial – TJ TradeHub",
  description: "Create your account and start your 7-day free trial.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Start your free trial"
      subtitle="7 days free. No credit card required."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
