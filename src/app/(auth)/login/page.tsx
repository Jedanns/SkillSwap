import LoginForm from "./form";

interface Props {
  searchParams: Promise<{ activated?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { activated } = await searchParams;
  return <LoginForm activated={activated === "1"} />;
}
