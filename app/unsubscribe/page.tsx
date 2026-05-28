import UnsubscribeClient from "./UnsubscribeClient";

export const metadata = {
  title: "Unsubscribe – TJ TradeHub",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const params = await searchParams;
  const token = params.t ?? null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "#0A0A0A",
          border: "1px solid #1F2937",
          borderRadius: "16px",
          padding: "40px 32px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <p style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#F9FAFB", letterSpacing: "-0.5px" }}>
            TJ <span style={{ color: "#A78BFA" }}>TradeHub</span>
          </p>
        </div>

        <UnsubscribeClient token={token} />
      </div>
    </div>
  );
}
