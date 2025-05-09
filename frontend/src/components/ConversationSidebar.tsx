import { ScrollArea } from "@radix-ui/react-scroll-area"
import { MessageSquareIcon } from "./icons/MessageSquareIcon"
import { PlusIcon } from "./icons/PlusIcon"
import { Button } from "./ui/Button"
import { Settings2Icon } from "./icons/Settings2Icon";
import { BadgeIcon } from "./icons/BadgeIcon";
import { XIcon } from "lucide-react";

interface ConversationSidebarProps {
    conversations?: any[];  // Need to change this type to Conversation[] type        
    onNewConversation?: () => void;
    onCloseSidebar?: () => void;
}
const conversations = [
    {
      id: "1",
      title: "Understanding Quantum Computing",
      date: "2023-06-15",
      model: "GPT-4",
      selected: true,
    },
    {
      id: "2",
      title: "Machine Learning Basics",
      date: "2023-06-14",
      model: "GPT-3.5",
    },
    {
      id: "3",
      title: "Web Development Tips",
      date: "2023-06-13",
      model: "Claude",
    },
    {
      id: "4",
      title: "Data Science Projects",
      date: "2023-06-12",
      model: "GPT-4",
    },
    {
      id: "5",
      title: "AI Ethics Discussion",
      date: "2023-06-11",
      model: "GPT-3.5",
    },
  ];

export const ConversationSidebar = (props: ConversationSidebarProps) => {


    return(
        <div className="flex flex-col h-full w-full border-r border-border/40 bg-card">
            {/* Logo and Close Button */}
            <div className="p-4 flex justify-between items-center bg-gradient-to-r from-accent/15 to-accent/5">
                <div className="font-semibold">TARS AI</div>
                <Button 
                    onClick={props.onCloseSidebar}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full md:hidden" 
                >
                    <XIcon size={18} />
                </Button>
            </div>
            {/* New Conversation Button */}
            <div className="mt-1 p-4">
                <Button
                    onClick={props.onNewConversation} 
                    className="w-full justify-start items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-medium shadow-md hover:shadow-lg transition-all duration-200">
                    <PlusIcon size={16} />
                    <div className="font-medium">
                        New Conversation
                    </div>
                </Button>
            </div>
            {/* Recent Conversations Heading*/}
            <div className="px-4 py-2">
                <div className="flex items-center gap-2 text-accent font-medium">
                    <MessageSquareIcon size={18} 
                    className="animate-pulse-glow"/>
                    <h2>Recent Conversations</h2>
                </div>
            </div>
            {/* Conversations List */} 
            {/* Need to implement this */}
            <ScrollArea className="flex-1 px-2">
                <div className="space-y-1 py-2">
                    {conversations.map((conversation) => {
                        // const isActive = activeConversationId === conversation.id || conversation.selected;
                        const isActive = false;
                        return(
                            <div key={conversation.id} className="">
                                {conversation.title}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
            
            <div className="p-3 space-y-2 mt-auto border-t border-border/40 bg-gradient-to-r from-accent/10 to-accent/25">
                <Button 
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-white hover:bg-accent/10">
                    <Settings2Icon size={18} />
                    <div className="text-sm">
                        Settings
                    </div>
                </Button>
                <Button 
                    variant="ghost"
                    size="sm"
                    className="w-full flex justify-start gap-2 text-accent hover:text-accent hover:bg-accent/10 py-5">
                    <BadgeIcon size={20} />
                    <div className="flex flex-col items-start">
                        <div className="text-sm">
                            Upgrade Plan
                        </div>
                        <div className="">
                            Get Access to more models
                        </div>
                    </div>
                </Button>
            </div>


        </div>
    )
}