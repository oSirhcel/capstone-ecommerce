import { StorePolicyClient } from "../policy-client";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const storeSlug = (await params).slug;

  return <StorePolicyClient slug={storeSlug} policyType="terms" />;
}
