import { Button } from "./ui/Button"

export const ConversationSidebar = () => {
    return(
        <div className="flex flex-col h-full w-[240px] border-r border-border/40 bg-card">
            <div className="p-4 bg-gradient-to-r from-accent/15 to-accent/5">
                TARS AI
            </div>
            <div className="p-4">
                <Button className="w-full justify-start gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-medium shadow-md hover:shadow-lg transition-all duration-200">
                
                    New Conversation
                </Button>
            </div>
        </div>
    )
}