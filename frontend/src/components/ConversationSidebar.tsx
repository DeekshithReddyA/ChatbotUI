import { ScrollArea } from "@radix-ui/react-scroll-area"
import { MessageSquareIcon } from "./icons/MessageSquareIcon"
import { PlusIcon } from "./icons/PlusIcon"
import { Button } from "./ui/Button"
import { Settings2Icon } from "./icons/Settings2Icon";
import { BadgeIcon } from "./icons/BadgeIcon";
import { TrashIcon, XIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { useState } from "react";

interface ConversationSidebarProps {
    conversations: any[];  // Need to change this type to Conversation[] type        
    onNewConversation: () => void;
    onCloseSidebar?: () => void;
    activeConversation: string;
    onSelectConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
}
export const ConversationSidebar = (props: ConversationSidebarProps) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);


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
                    {props.conversations.map((conversation) => {
                        const isActive = props.activeConversation === conversation.id || conversation.selected;
                        return(
                            <div
                            key={conversation.id}
                            className={cn(
                              "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:bg-accent/20 relative",
                              isActive
                                ? "bg-primary/30 text-primary-foreground shadow-sm border-l-2 border-accent font-medium"
                                : "text-muted-foreground",
                            )}
                            onClick={() => props.onSelectConversation(conversation.id)}
                            onMouseEnter={() => setHoveredId(conversation.id)}
                            onMouseLeave={() => setHoveredId(null)}
                          >
                            <div className="flex flex-col overflow-hidden">
                              <span
                                className={cn(
                                  "truncate font-medium text-sm",
                                  isActive && "text-accent",
                                )}
                              >
                                {conversation.title}
                              </span>
                              {/* <span className="truncate text-xs opacity-70 mt-0.5">
                                {conversation.model} • {conversation.date}
                              </span> */}
                            </div>
            
                            {(hoveredId === conversation.id || isActive) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-100 hover:bg-transparent hover:scale-110 hover:text-red-500 flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  props.onDeleteConversation(conversation.id);
                                }}
                              >
                                <TrashIcon size={14} />
                              </Button>
                            )}
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