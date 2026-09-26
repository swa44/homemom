import { LoginApp } from "@/components/LoginApp";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <LoginApp hasError={params.error === "oauth"} />;
}
