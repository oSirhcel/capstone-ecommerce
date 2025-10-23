// Australian default policy texts for stores
export const AU_DEFAULT_POLICIES = {
  shippingPolicy: `Shipping Policy

We offer shipping across Australia with the following options:

Standard Shipping (5-7 business days): $9.95 AUD
Express Shipping (2-3 business days): $19.95 AUD
Next Day Delivery (Metro areas only): $29.95 AUD

Free shipping on orders over $75 AUD.

International shipping is available to select countries. Please contact us for international shipping rates.

Processing Time:
Orders are typically processed within 1-2 business days. During peak periods, processing may take up to 3 business days.

Delivery Areas:
We deliver to all Australian states and territories. Remote areas may have extended delivery times.

Tracking:
All orders include tracking information which will be sent to your email once your order ships.

For any shipping inquiries, please contact us at [contact email].`,

  returnPolicy: `Returns & Refunds Policy

We want you to be completely satisfied with your purchase. If you're not happy, we're here to help.

Return Period:
You have 30 days from the date of delivery to return items for a full refund or exchange.

Return Conditions:
- Items must be in original condition with tags attached
- Items must be unworn, unwashed, and free from damage
- Original packaging and receipt required
- Some items may be excluded (see exclusions below)

How to Return:
1. Contact us at [contact email] to initiate a return
2. We'll provide you with a return authorization number
3. Package items securely with original packaging
4. Send to our returns address (provided with authorization)

Refund Processing:
- Refunds will be processed within 5-7 business days of receiving returned items
- Original payment method will be credited
- Shipping costs are non-refundable unless item was defective

Exchanges:
- Exchanges are subject to availability
- Size exchanges are free of charge
- Style exchanges may incur additional charges

Exclusions:
- Custom or personalized items
- Items damaged by misuse
- Items returned after 30 days
- Items without original packaging

Australian Consumer Law:
This policy does not affect your rights under Australian Consumer Law.`,

  privacyPolicy: `Privacy Policy

We are committed to protecting your privacy and personal information in accordance with the Privacy Act 1988 (Cth) and Australian Privacy Principles.

Information We Collect:
- Personal information (name, email, address, phone number)
- Payment information (processed securely through our payment providers)
- Order history and preferences
- Website usage data and cookies

How We Use Your Information:
- Process and fulfill your orders
- Communicate about your orders and our services
- Improve our website and services
- Send marketing communications (with your consent)
- Comply with legal obligations

Information Sharing:
We do not sell your personal information. We may share information with:
- Service providers who assist with order fulfillment
- Payment processors
- Shipping companies
- Legal authorities when required by law

Data Security:
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

Your Rights:
- Access your personal information
- Correct inaccurate information
- Request deletion of your information
- Opt-out of marketing communications
- Lodge a complaint with the Privacy Commissioner

Cookies:
We use cookies to improve your browsing experience and analyze website traffic. You can disable cookies in your browser settings.

Contact Us:
For privacy-related inquiries, contact us at [contact email].

This policy was last updated on [date].`,

  termsOfService: `Terms of Service

By using our website and services, you agree to these terms and conditions.

Acceptance of Terms:
By accessing or using our website, you agree to be bound by these terms and all applicable laws and regulations.

Use License:
Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.

Prohibited Uses:
You may not use our website:
- For any unlawful purpose or to solicit others to perform unlawful acts
- To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances
- To infringe upon or violate our intellectual property rights or the intellectual property rights of others
- To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate
- To submit false or misleading information
- To upload or transmit viruses or any other type of malicious code

Product Information:
- Product descriptions and images are for illustrative purposes
- We reserve the right to modify product information without notice
- Prices are subject to change without notice
- All prices include GST where applicable

Orders and Payment:
- Orders are subject to acceptance and availability
- We reserve the right to refuse or cancel orders
- Payment must be received before order processing
- We accept major credit cards and PayPal

Limitation of Liability:
In no event shall our company or its suppliers be liable for any damages arising out of the use or inability to use our website.

Governing Law:
These terms are governed by the laws of Australia and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.

Contact Information:
For questions about these terms, contact us at [contact email].

These terms were last updated on [date].`,
} as const;

export function getDefaultPolicy(
  type: keyof typeof AU_DEFAULT_POLICIES,
): string {
  return AU_DEFAULT_POLICIES[type];
}

export function replacePlaceholders(
  text: string,
  replacements: Record<string, string>,
): string {
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\[${key}\\]`, "g"), value);
  }
  return result;
}
