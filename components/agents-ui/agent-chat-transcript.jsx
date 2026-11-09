"use client"
import { Streamdown } from "streamdown"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { AgentChatIndicator } from "@/components/agents-ui/agent-chat-indicator"

/**
 * A chat transcript component that displays a conversation between the user and agent.
 * Shows messages with timestamps and origin indicators, plus a thinking indicator
 * when the agent is processing.
 *
 * @extends ComponentProps<'div'>, ComponentProps<typeof MessageScrollerProvider>, ComponentProps<typeof MessageScrollerViewport>, ComponentProps<typeof MessageScrollerContent>
 *
 *
 * @example
 * ```tsx
 * <AgentChatTranscript
 *   agentState={agentState}
 *   messages={chatMessages}
 * />
 * ```
 */
export function AgentChatTranscript({
  scrollAnchor,
  autoScroll = true,
  scrollMargin,
  scrollEdgeThreshold,
  preserveScrollOnPrepend,
  scrollPreviousItemPeek,
  defaultScrollPosition = "last-anchor",
  scrollButtonRender,
  scrollButtonBehavior,
  scrollButtonDirection,
  spacerClassName,
  agentState,
  messages = [],
  className,
  // Personalización del proyecto: avatar del agente, clases de las burbujas y texto en español
  agentAvatar,
  agentBubbleClassName,
  userBubbleClassName,
  thinkingLabel = "Pensando…",
  ...props
}) {
  const ultimoDelAgente = messages.findLastIndex((m) => !m.from?.isLocal)

  return (
    <MessageScrollerProvider
      autoScroll={autoScroll}
      scrollMargin={scrollMargin}
      defaultScrollPosition={defaultScrollPosition}
      scrollEdgeThreshold={scrollEdgeThreshold}
      scrollPreviousItemPeek={scrollPreviousItemPeek}
    >
      <MessageScroller className={className} {...props}>
        <MessageScrollerViewport
          preserveScrollOnPrepend={preserveScrollOnPrepend}
        >
          <MessageScrollerContent
            spacerClassName={spacerClassName}
            aria-busy={agentState === "thinking"}
          >
            {messages.map((receivedMessage, indice) => {
              const { id, timestamp, from, message } = receivedMessage
              const time = new Date(timestamp)
              const isUser = from?.isLocal
              const locale =
                typeof navigator !== "undefined" ? navigator.language : "es-ES"
              const title = time.toLocaleTimeString(locale, {
                timeStyle: "full",
              })
              let _scrollAnchor = false

              if (
                scrollAnchor === "any" ||
                (scrollAnchor === "user" && isUser) ||
                (scrollAnchor === "other" && !isUser)
              ) {
                _scrollAnchor = true
              }

              return (
                <MessageScrollerItem
                  key={id}
                  messageId={id}
                  scrollAnchor={_scrollAnchor}
                >
                  <Message align={isUser ? "end" : "start"} title={title}>
                    {!isUser && agentAvatar && (
                      <MessageAvatar className="-mt-1 -ml-1 self-start overflow-visible rounded-none bg-transparent">
                        {/* Puede ser un nodo o una función (mensaje, esUltimoDelAgente) */}
                        {typeof agentAvatar === "function"
                          ? agentAvatar(
                              receivedMessage,
                              indice === ultimoDelAgente
                            )
                          : agentAvatar}
                      </MessageAvatar>
                    )}
                    <MessageContent>
                      <Bubble
                        align={isUser ? "end" : "start"}
                        variant={
                          isUser
                            ? "secondary"
                            : agentBubbleClassName
                              ? "tinted"
                              : "ghost"
                        }
                      >
                        <BubbleContent
                          className={
                            isUser ? userBubbleClassName : agentBubbleClassName
                          }
                        >
                          <Streamdown>{message}</Streamdown>
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )
            })}

            {/* Agent is thinking indicator */}
            {agentState === "thinking" && (
              <MessageScrollerItem>
                <Marker role="status">
                  <MarkerIcon>
                    <AgentChatIndicator size="sm" />
                  </MarkerIcon>
                  <MarkerContent className="shimmer">
                    {thinkingLabel}
                  </MarkerContent>
                </Marker>
              </MessageScrollerItem>
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>

        {/* Scroll to bottom button */}
        <MessageScrollerButton
          variant="outline"
          className="rounded-full"
          render={scrollButtonRender}
          behavior={scrollButtonBehavior}
          direction={scrollButtonDirection}
        />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}
