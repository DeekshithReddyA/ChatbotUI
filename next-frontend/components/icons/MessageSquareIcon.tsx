import { ButtonProps } from "./ButtonProps";

export const MessageSquareIcon = (props: ButtonProps) => {
    return <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || "2"} strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-message-square-icon lucide-message-square ${props.className}`}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}