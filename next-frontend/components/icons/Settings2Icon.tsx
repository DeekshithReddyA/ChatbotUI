import { ButtonProps } from "./ButtonProps";

export const Settings2Icon = (props: ButtonProps) => {
    return <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || "2"} strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-settings2-icon lucide-settings-2 ${props.className}`}><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
}