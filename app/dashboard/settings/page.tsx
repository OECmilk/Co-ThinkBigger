import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getAiStatus } from "@/lib/ai/client";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "AI接続" };

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const status = await getAiStatus();

  return <SettingsClient status={status} />;
}
