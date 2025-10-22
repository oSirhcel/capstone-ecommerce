import { StorePolicyClient } from "../policy-client";

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const storeSlug = (await params).slug;

  return <StorePolicyClient slug={storeSlug} policyType="privacy" />;
}
