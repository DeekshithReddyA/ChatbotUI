import { ScrollArea } from "@radix-ui/react-scroll-area"
import { MessageSquareIcon } from "./icons/MessageSquareIcon"
import { PlusIcon } from "./icons/PlusIcon"
import { Button } from "./ui/Button"
import { Settings2Icon } from "./icons/Settings2Icon";
import { BadgeIcon } from "./icons/BadgeIcon";
import { TrashIcon, XIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { useState, useRef, useEffect } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface ConversationSidebarProps {
    conversations: any[];  // Need to change this type to Conversation[] type        
    onNewConversation: () => void;
    onCloseSidebar?: () => void;
    activeConversation: string;
    onSelectConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
    isLoadingMore?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

// Helper to format message preview for conversation list
const formatMessagePreview = (messageContent: string | any) => {
    // Ensure messageContent is a string before using string methods
    if (!messageContent) return 'New conversation';
    
    // Handle non-string types
    if (typeof messageContent !== 'string') {
        return 'New conversation';
    }
    
    // Check if the messageContent might be JSON content with attachments
    if (messageContent.startsWith('[{') && messageContent.endsWith('}]')) {
        try {
            const content = JSON.parse(messageContent);
            if (Array.isArray(content)) {
                const textParts = content.filter(part => part.type === 'text');
                const imageParts = content.filter(part => part.type === 'image');
                const fileParts = content.filter(part => part.type === 'file');
                
                let preview = '';
                
                // Add text content if available
                if (textParts.length > 0) {
                    preview = textParts[0].text;
                    if (preview.length > 30) {
                        preview = preview.substring(0, 30) + '...';
                    }
                }
                
                // Add attachment indicators
                if (imageParts.length > 0 || fileParts.length > 0) {
                    const attachments = [];
                    if (imageParts.length > 0) {
                        attachments.push(`${imageParts.length} image${imageParts.length > 1 ? 's' : ''}`);
                    }
                    if (fileParts.length > 0) {
                        attachments.push(`${fileParts.length} file${fileParts.length > 1 ? 's' : ''}`);
                    }
                    
                    if (preview) {
                        preview += ` [${attachments.join(', ')}]`;
                    } else {
                        preview = `[${attachments.join(', ')}]`;
                    }
                }
                
                return preview || 'New conversation';
            }
        } catch (e) {
            // If JSON parsing fails, return the original string truncated
            return messageContent.length > 40 ? messageContent.substring(0, 40) + '...' : messageContent;
        }
    }
    
    // Default case: just return the messageContent truncated if needed
    return messageContent.length > 40 ? messageContent.substring(0, 40) + '...' : messageContent;
};

export const ConversationSidebar = (props: ConversationSidebarProps) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    // Handle scroll to detect when user reached the bottom
    const handleScroll = (e: any) => {
        const scrollElement = e.currentTarget;
        
        // Check if we're near the bottom (within 100px)
        const isNearBottom = 
            scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 100;
            
        // Load more conversations if near bottom and more are available
        if (isNearBottom && props.hasMore && !props.isLoadingMore && props.onLoadMore) {
            props.onLoadMore();
        }
    };

    // Handle delete with confirmation state
    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingId(id);
        props.onDeleteConversation(id);
        
        // Clear deleting state after a short delay
        setTimeout(() => {
            setDeletingId(null);
        }, 300);
    };

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
            <ScrollArea className="flex-1 px-2" ref={scrollAreaRef} onScroll={handleScroll}>
                <div className="space-y-1 py-2">
                    {props.conversations.length === 0 ? (
                        <div className="px-3 py-6 text-center text-muted-foreground text-sm">
                            No conversations yet
                        </div>
                    ) : props.conversations.map((conversation) => {
                        const isActive = props.activeConversation === conversation.id || conversation.selected;
                        const isDeleting = deletingId === conversation.id;
                        
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
                                {conversation.title || 'Untitled Conversation'}
                              </span>
                              <span className="truncate text-xs opacity-70 mt-0.5">
                                {formatMessagePreview(conversation.lastMessage)}
                              </span>
                            </div>
            
                            {isDeleting ? (
                                <div className="h-6 w-6 opacity-70">
                                    <LoadingSpinner size="small" centered={false} />
                                </div>
                            ) : ((hoveredId === conversation.id || isActive) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-100 hover:bg-transparent hover:scale-110 hover:text-red-500 flex items-center justify-center"
                                onClick={(e) => handleDelete(conversation.id, e)}
                              >
                                <TrashIcon size={14} />
                              </Button>
                            ))}
                          </div>
                        )
                    })}
                    
                    {/* Loading indicator */}
                    {props.isLoadingMore && (
                        <div className="py-3">
                            <LoadingSpinner size="small" message="Loading more..." centered={false} />
                        </div>
                    )}
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