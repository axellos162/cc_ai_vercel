import "./globals.css";

export const metadata = {
  title: "Fashion Query API",
  description: "Backend Query API for fashion product search",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
