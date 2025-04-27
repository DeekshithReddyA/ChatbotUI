import { ConversationSidebar } from "./ConversationSidebar"
import MessageInput from "./MessageInput";
import { Messages } from "./Messages";
import ModelSelector from "./ModelSelection";

export const ChatInterface = () => {
    return (
        <div className="flex h-screen bg-background text-foreground">
            <ConversationSidebar />
            <div className="flex flex-col flex-1 h-full p-4 bg-background">
                <div className="flex-1 overflow-hidden mb-4">
                    <ModelSelector />
                    <Messages />
                </div>

                <MessageInput />
            </div>
        </div>
    )
}