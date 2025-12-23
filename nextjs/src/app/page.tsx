import { Suspense } from "react";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { ChatContainer } from "@/components/chat/ChatContainer";

export default function HomePage(): React.JSX.Element {
  return (
    <div className="flex flex-col h-screen">
      <Suspense fallback={<div>Loading chat...</div>}>
        <ChatProvider>
          <ChatContainer />
        </ChatProvider>
      </Suspense>
    </div>
  );
}
