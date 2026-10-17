import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getSessionUser } from "@/lib/dal";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Belt-and-suspenders: proxy.ts already gates public routes, but if the
  // proxy matcher ever stops covering a route, this layout still requires a
  // session (see the Next.js Data Security guide).
  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
