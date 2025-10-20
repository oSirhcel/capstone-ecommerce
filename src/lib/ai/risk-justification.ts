import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import type { RiskScore, RiskPayload } from "@/lib/zeroTrustMiddleware";

/**
 * Generate AI-powered justification for a zero trust risk assessment
 * @param riskScore The calculated risk score with factors
 * @param payload The full risk payload with transaction details
 * @returns Human-readable justification with recommendations
 */
export async function generateRiskJustification(
  riskScore: RiskScore,
  payload: RiskPayload
): Promise<string> {
  try {
    // Check for required environment variable
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error(
        "Google AI API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your .env file. " +
        "Get your API key from: https://aistudio.google.com/apikey"
      );
    }

    // Build a comprehensive prompt with all risk data
    const prompt = buildJustificationPrompt(riskScore, payload);

    // Use Gemini Flash for fast, cost-effective generation
    const model = google("gemini-2.0-flash-exp");

    const result = await generateText({
      model,
      prompt,
      temperature: 0.5, // Lower temperature for more consistent, factual output
    });

    return result.text;
  } catch (error) {
    console.error("Error generating risk justification:", error);
    // Return a fallback explanation
    return generateFallbackJustification(riskScore, payload);
  }
}

/**
 * Build a detailed prompt for the AI model
 */
function buildJustificationPrompt(
  riskScore: RiskScore,
  payload: RiskPayload
): string {
  const { score, decision, factors, confidence } = riskScore;

  // Format risk factors into a readable list
  const factorsList = factors
    .map((f) => `• ${f.factor} (Impact: ${f.impact}): ${f.description}`)
    .join("\n");

  // Extract key transaction details
  const transactionAmount = (payload.totalAmount / 100).toFixed(2);
  const accountAgeInfo = payload.accountAge
    ? `${Math.floor(payload.accountAge / 86400)} days old`
    : "unknown";
  const transactionHistory = payload.totalPastTransactions
    ? `${payload.successfulPastTransactions}/${payload.totalPastTransactions} successful (${payload.transactionSuccessRate?.toFixed(1)}%)`
    : "no history";

  return `You are a fraud detection expert analyzing a transaction risk assessment. Provide a clear, professional explanation of why this transaction received its risk score. Your target audience is a small business owner who is reviewing the transaction.

RISK ASSESSMENT RESULTS:
- Risk Score: ${score}/100
- Decision: ${decision.toUpperCase()}
- Confidence: ${(confidence * 100).toFixed(0)}%

TRANSACTION DETAILS:
- Amount: $${transactionAmount} AUD
- Items: ${payload.itemCount} items (${payload.uniqueItemCount} unique products)
- Stores: ${payload.uniqueStoreCount} vendor(s)
- User Type: ${payload.userType ?? "guest"}
- Account Role: ${payload.accountRole ?? "customer"}
- Account Age: ${accountAgeInfo}
- Transaction History: ${transactionHistory}

RISK FACTORS DETECTED:
${factorsList}

${payload.recentTransactionFailures && payload.recentTransactionFailures > 0 ? `⚠️ Recent Failures: ${payload.recentTransactionFailures} failed transaction(s) in the last hour` : ""}
${payload.failedLoginAttempts && payload.failedLoginAttempts > 0 ? `⚠️ Failed Logins: ${payload.failedLoginAttempts} recent failed login attempt(s)` : ""}
${payload.concurrentSessions && payload.concurrentSessions > 2 ? `⚠️ Multiple Sessions: ${payload.concurrentSessions} active sessions detected` : ""}

Please provide a response with the following sections:

1. **Risk Summary** (2-3 sentences explaining the overall risk level and primary concerns)

2. **Key Risk Factors** (Explain the most significant risk factors and why they matter)

3. **Recommended Actions** (3-5 specific actionable steps for the admin reviewing this transaction)

4. **Business Context** (Brief note on fraud prevention with the business and customer experience in mind)

Keep the explanation professional, clear, actionable and easy to understand for all demographics. Focus on helping the admin or shop owner make an informed decision.`;
}

/**
 * Generate a fallback explanation if AI generation fails
 */
function generateFallbackJustification(
  riskScore: RiskScore,
  payload: RiskPayload
): string {
  const { score, decision, factors } = riskScore;
  const riskLevel = score > 50 ? "HIGH" : score > 20 ? "MODERATE" : "LOW";

  let explanation = `Risk Level: ${riskLevel} (${score}/100) - Decision: ${decision.toUpperCase()}\n\n`;

  explanation += `This transaction was assessed with a risk score of ${score}/100. `;

  if (factors.length > 0) {
    explanation += `The following risk factors were identified:\n\n`;
    factors.forEach((factor) => {
      explanation += `• ${factor.description} (Impact: +${factor.impact})\n`;
    });
  }

  explanation += `\nTransaction Details:\n`;
  explanation += `• Amount: $${(payload.totalAmount / 100).toFixed(2)} AUD\n`;
  explanation += `• Items: ${payload.itemCount} total (${payload.uniqueItemCount} unique)\n`;
  explanation += `• Stores: ${payload.uniqueStoreCount}\n`;

  if (decision === "deny") {
    explanation += `\nRecommended Action: This transaction should be blocked or require manual review before processing.\n`;
  } else if (decision === "warn") {
    explanation += `\nRecommended Action: Consider additional verification steps before processing this transaction.\n`;
  } else {
    explanation += `\nRecommended Action: Transaction can proceed with normal processing.\n`;
  }

  return explanation;
}

/**
 * Generate a short summary for display in tables/lists
 */
export function generateShortSummary(riskScore: RiskScore): string {
  const { score, factors } = riskScore;

  if (factors.length === 0) {
    return "No significant risk factors detected.";
  }

  // Get top 2 risk factors
  const topFactors = factors
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 2)
    .map((f) => f.factor.toLowerCase().replace(/_/g, " "));

  return `Risk ${score}/100: ${topFactors.join(", ")}`;
}


