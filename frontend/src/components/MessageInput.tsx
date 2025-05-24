import React, { useState, useRef, useEffect } from "react";
import {
  SendIcon,
  // Sparkles,
  MicIcon,
  PaperclipIcon,
  SearchIcon,
  XIcon,
  ImageIcon,
  FileIcon,
  // StopCircleIcon,
  SquareIcon
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/TextArea";

interface MessageInputProps {
  onSendMessage?: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  selectedContext?: string | null;
  onClearContext?: () => void;
  onStopGeneration?: () => void;
}

interface FilePreview {
  file: File;
  preview: string;
  type: "image" | "document";
}

const MessageInput = ({
  onSendMessage = () => {},
  isLoading = false,
  placeholder = "Type your message here...",
  selectedContext = null,
  onClearContext = () => {},
  onStopGeneration = () => {},
}: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [contextQuote, setContextQuote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set context quote when selectedContext changes
  useEffect(() => {
    if (selectedContext) {
      setContextQuote(selectedContext);
    }
  }, [selectedContext]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set the height to the scrollHeight to fit the content
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || files.length > 0) && !isLoading) {
      // Include context in the message if present
      const fullMessage = contextQuote
        ? `Regarding: "${contextQuote}"

${message}`
        : message;

      onSendMessage(fullMessage, files);
      setMessage("");
      setFiles([]);
      setFilePreviews([]);
      setContextQuote(null);
      onClearContext();

      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const clipboardItems = e.clipboardData.items;
    const newFiles: File[] = [];

    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) newFiles.push(file);
      }
    }

    if (newFiles.length > 0) {
      addFiles(newFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
      // Reset the input value so the same file can be selected again
      e.target.value = "";
    }
  };

  const addFiles = (newFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  // Generate previews for files
  useEffect(() => {
    const newPreviews: FilePreview[] = [];

    files.forEach((file) => {
      const isImage = file.type.startsWith("image/");

      if (isImage) {
        const preview = URL.createObjectURL(file);
        newPreviews.push({ file, preview, type: "image" });
      } else {
        newPreviews.push({ file, preview: "", type: "document" });
      }
    });

    setFilePreviews(newPreviews);

    // Cleanup function to revoke object URLs
    return () => {
      newPreviews.forEach((item) => {
        if (item.type === "image") {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [files]);

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setFilePreviews((prevPreviews) =>
      prevPreviews.filter((_, i) => i !== index),
    );
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  return (
    <div className="w-full bg-background border-t border-border/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 max-w-[900px] mx-auto"
      >
        {/* Context Quote Preview */}
        {contextQuote && (
          <div className="mb-2">
            <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-lg p-2 pr-3 max-w-fit">
              <div className="flex-1 text-sm text-foreground overflow-hidden">
                <span className="font-medium text-accent">Replying to: </span>
                <span className="text-foreground/80">
                  {contextQuote.length > 60
                    ? `"${contextQuote.substring(0, 60)}..."`
                    : `"${contextQuote}"`}
                </span>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-5 w-5 rounded-full hover:bg-accent/20"
                onClick={() => {
                  setContextQuote(null);
                  onClearContext();
                }}
              >
                <XIcon className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
        )}

        {/* File Previews */}
        {filePreviews.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {filePreviews.map((item, index) => (
              <div
                key={index}
                className="relative group bg-card border border-border/60 rounded-lg overflow-hidden"
              >
                {item.type === "image" ? (
                  <div className="w-20 h-20 relative">
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 flex flex-col items-center justify-center p-2">
                    <FileIcon className="h-8 w-8 text-primary/70" />
                    <span className="text-xs truncate max-w-full">
                      {item.file.name.length > 10
                        ? `${item.file.name.substring(0, 7)}...`
                        : item.file.name}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end gap-2">
          <div className="relative flex-1 rounded-2xl overflow-hidden border border-border/60 bg-card/80 shadow-md">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onPaste={handlePaste}
              placeholder={placeholder}
              className={cn(
                "min-h-[48px] max-h-[200px] resize-none pr-12 bg-transparent border-0",
                "transition-all duration-200 overflow-y-auto",
                isFocused ? "ring-0" : "hover:bg-card/90",
              )}
              style={{ height: "auto" }}
              disabled={isLoading}
            />
            <div className="absolute right-3 bottom-2 flex space-x-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary-foreground hover:bg-primary/20"
                onClick={handleAttachmentClick}
              >
                <PaperclipIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary-foreground hover:bg-primary/20"
              >
                <MicIcon className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileSelect}
              />
            </div>
          </div>
          <Button
            type={isLoading ? "button" : "submit"}
            size="icon"
            disabled={message.trim() === "" && files.length === 0 && !isLoading}
            className={cn(
              "h-10 w-10 rounded-full shadow-md hover:shadow-lg transition-all duration-200",
              isLoading 
                ? "bg-red-500/10 hover:bg-red-500/20 text-red-500"
                : "bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            onClick={(e) => {
              if (isLoading) {
                e.preventDefault();
                onStopGeneration();
              }
            }}
          >
            {isLoading ? (
              <SquareIcon className="h-5 w-5" />
            ) : (
              <SendIcon className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Bottom Toolbar */}
        <div className="flex justify-between items-center mt-2 max-w-[800px] mx-auto">
          <div className="flex space-x-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg"
            >
              <SearchIcon className="h-3 w-3 mr-1" />
              Search
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg"
            >
              <ImageIcon className="h-3 w-3 mr-1" />
              Gallery
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;