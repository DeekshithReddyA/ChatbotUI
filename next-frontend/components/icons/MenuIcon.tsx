import { ButtonProps } from "./ButtonProps";

export const MenuIcon = (props: ButtonProps) => {
    return <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || "2"} strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-menu ${props.className}`}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
} 