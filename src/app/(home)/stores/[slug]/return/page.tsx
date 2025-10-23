import { StorePolicyClient } from "../policy-client";

export default async function ReturnPolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const storeSlug = (await params).slug;

  return <StorePolicyClient slug={storeSlug} policyType="return" />;
}
