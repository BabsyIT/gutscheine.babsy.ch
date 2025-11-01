// This is a root layout that just passes through to locale-specific layouts
// The actual layout is in [locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
