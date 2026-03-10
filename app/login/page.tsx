import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In – TJ TradeHub",
  description: "Sign in to your TJ TradeHub account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const verified = params.verified === "1";
  const passwordReset = params.reset === "1";
  const tokenExpired = params.error === "token_expired";
  const invalidToken = params.error === "invalid_token";

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your trading journal."
    >
      {passwordReset && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Password updated successfully! You can now sign in.
        </div>
      )}
      {verified && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Email verified successfully! You can now sign in.
        </div>
      )}
      {tokenExpired && (
        <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          Your verification link has expired. Please register again.
        </div>
      )}
      {invalidToken && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Invalid verification link. Please check your email or register again.
        </div>
      )}
      <LoginForm />
    </AuthLayout>
  );
}
