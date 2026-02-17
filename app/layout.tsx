export const metadata = {
  title: "broT Portal",
  description: "broTher collecTive members portal"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#07070b", color: "white" }}>
        {children}
      </body>
    </html>
  );
}
