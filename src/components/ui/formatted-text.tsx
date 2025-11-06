import React from "react";

// Component to render formatted text with proper styling
export function FormattedText({ text }: { text: string }) {
  if (!text)
    return <span className="text-muted-foreground">No text provided.</span>;

  // Split text into lines and process each line
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        // Handle empty lines
        if (line.trim() === "") {
          return <br key={index} />;
        }

        // Handle bullet points (lines starting with *, -, or •)
        if (/^[\s]*[\*\-\•]\s/.test(line)) {
          const content = line.replace(/^[\s]*[\*\-\•]\s/, "");
          return (
            <div key={index} className="ml-4 flex items-start gap-2">
              <span className="text-muted-foreground mt-1 text-xs">•</span>
              <span className="flex-1 text-xs">
                {formatInlineText(content)}
              </span>
            </div>
          );
        }

        // Handle numbered lists
        if (/^[\s]*\d+\.\s/.test(line)) {
          const match = /^([\s]*\d+\.)\s(.*)$/.exec(line);
          if (match) {
            const [, number, content] = match;
            return (
              <div key={index} className="ml-4 flex items-start gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  {number}
                </span>
                <span className="flex-1 text-xs">
                  {formatInlineText(content)}
                </span>
              </div>
            );
          }
        }

        // Handle headers (lines with ## or ###)
        if (/^[\s]*#{2,3}\s/.test(line)) {
          const isH2 = line.startsWith("##");
          const content = line.replace(/^[\s]*#{2,3}\s/, "");
          const HeadingTag = isH2 ? "h3" : "h4";
          return (
            <HeadingTag
              key={index}
              className={`text-foreground mt-4 font-bold ${isH2 ? "text-xl" : "text-lg"}`}
            >
              {content}
            </HeadingTag>
          );
        }

        // Handle code blocks (lines starting with ```)
        if (/^[\s]*```/.test(line)) {
          return (
            <div
              key={index}
              className="bg-muted rounded-md border p-3 font-mono text-xs"
            >
              <code>{line.replace(/^[\s]*```/, "")}</code>
            </div>
          );
        }

        // Regular paragraphs
        return (
          <p key={index} className="text-xs leading-relaxed">
            {formatInlineText(line)}
          </p>
        );
      })}
    </div>
  );
}

// Helper function to format inline text (bold, italic, code, etc.)
function formatInlineText(text: string) {
  const parts = [];
  let currentIndex = 0;

  // Handle bold text (**text** or __text__)
  const boldRegex = /\*\*(.*?)\*\*|__(.*?)__/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(text.slice(currentIndex, match.index));
    }

    // Add the bold text
    const boldContent = match[1] || match[2];
    parts.push(
      <strong
        key={`bold-${match.index}`}
        className="text-foreground font-semibold"
      >
        {boldContent}
      </strong>,
    );

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);

    // Handle inline code (`code`)
    const codeRegex = /`([^`]+)`/g;
    let codeMatch;
    let codeIndex = 0;

    while ((codeMatch = codeRegex.exec(remainingText)) !== null) {
      // Add text before the code match
      if (codeMatch.index > codeIndex) {
        parts.push(remainingText.slice(codeIndex, codeMatch.index));
      }

      // Add the inline code
      parts.push(
        <code
          key={`code-${currentIndex + codeMatch.index}`}
          className="bg-muted rounded px-1 py-0.5 font-mono text-[10px]"
        >
          {codeMatch[1]}
        </code>,
      );

      codeIndex = codeMatch.index + codeMatch[0].length;
    }

    // Handle italic text (*text* or _text_)
    const italicRegex =
      /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|(?<!_)_(?!_)([^_]+)_(?!_)/g;
    let italicMatch;
    let italicIndex = 0;

    while ((italicMatch = italicRegex.exec(remainingText)) !== null) {
      // Add text before the italic match
      if (italicMatch.index > italicIndex) {
        parts.push(remainingText.slice(italicIndex, italicMatch.index));
      }

      // Add the italic text
      const italicContent = italicMatch[1] || italicMatch[2];
      parts.push(
        <em
          key={`italic-${currentIndex + italicMatch.index}`}
          className="text-foreground italic"
        >
          {italicContent}
        </em>,
      );

      italicIndex = italicMatch.index + italicMatch[0].length;
    }

    // Add remaining text after formatting processing
    if (italicIndex < remainingText.length) {
      parts.push(remainingText.slice(italicIndex));
    }
  }

  return parts.length > 0 ? parts : text;
}
