"use client";

import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { ChatMessage as ChatMessageType } from "@/types/ai-assistant";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "mb-4 flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar
        className={cn(
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        <AvatarFallback>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              p: ({ children }) => (
                <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-2 list-inside list-disc space-y-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-2 list-inside list-decimal space-y-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="ml-2">{children}</li>,
              code: ({ children, className, ...props }) => (
                <code
                  {...props}
                  className={cn(
                    "rounded bg-black/20 px-1.5 py-0.5 font-mono text-xs",
                    className,
                  )}
                >
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="mb-2 overflow-x-auto rounded bg-black/20 p-3">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="mb-2 border-l-4 border-current pl-3 italic opacity-75">
                  {children}
                </blockquote>
              ),
              h1: ({ children }) => (
                <h1 className="mb-2 text-base font-bold">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="mb-2 text-sm font-bold">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-2 text-sm font-semibold">{children}</h3>
              ),
              table: ({ children }) => (
                <table className="mb-2 border-collapse border border-current">
                  {children}
                </table>
              ),
              th: ({ children }) => (
                <th className="border border-current px-2 py-1 font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-current px-2 py-1">{children}</td>
              ),
              a: ({ href, children }) => {
                const isInternal =
                  typeof href === "string" && href.startsWith("/");
                if (isInternal) {
                  return (
                    <a
                      href={href}
                      className="bg-primary text-primary-foreground inline-flex items-center rounded px-3 py-1.5 no-underline hover:opacity-90"
                    >
                      {children}
                    </a>
                  );
                }
                return (
                  <a
                    href={href}
                    className="underline hover:opacity-75"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                );
              },
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {message.timestamp && (
          <p className="mt-2 text-xs opacity-70">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
