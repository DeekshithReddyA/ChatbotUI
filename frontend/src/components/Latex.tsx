//Latex.tsx
import React, { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import 'katex/dist/katex.min.css';

interface PreviewProps {
  content: string;
}
const LatexText: React.FC<PreviewProps> = ({ content }: {content: string}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  return (
    <div className="p-4 preview-content preview-fade w-full overflow-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const code = String(children).replace(/\n$/, '');
            
            if (match) {
              return (
                <div className="relative group max-h-[500px] overflow-auto">
                  <div className='sticky top-0 right-8 float-right z-10'>
                  <button
                    onClick={() => handleCopyCode(code)}
                    className="p-2 rounded-lg bg-gray-800 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Copy code"
                    >
                    {copiedCode === code ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  </div>
                  <SyntaxHighlighter 
                    style={vscDarkPlus as any}
                    language={match[1]}
                    showLineNumbers={true}
                    wrapLines={false}
                    customStyle={{ 
                      margin: 0,
                      overflow: 'auto',
                      maxWidth: '100%'
                    }}
                    >
                    {code}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Add these handlers for lists
          ul({ node, children, ...props }) {
            return <ul className="list-disc pl-6 my-2" {...props}>{children}</ul>;
          },
          ol({ node, children, ...props }) {
            return <ol className="list-decimal pl-6 my-2" {...props}>{children}</ol>;
          },
          li({ node, children, ...props }) {
            return <li className="my-1" {...props}>{children}</li>;
          }
        }}
        >
        {content}
      </ReactMarkdown>
    </div>
  );
};
export default memo(LatexText);