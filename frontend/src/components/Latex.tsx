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
          },
          // Add handlers for headings
          h1({ node, children, ...props }) {
            return <h1 className="text-3xl font-bold mt-6 mb-4" {...props}>{children}</h1>;
          },
          h2({ node, children, ...props }) {
            return <h2 className="text-2xl font-bold mt-5 mb-3" {...props}>{children}</h2>;
          },
          h3({ node, children, ...props }) {
            return <h3 className="text-xl font-bold mt-4 mb-2" {...props}>{children}</h3>;
          },
          h4({ node, children, ...props }) {
            return <h4 className="text-lg font-bold mt-3 mb-2" {...props}>{children}</h4>;
          },
          // Add handlers for paragraphs and links
          p({ node, children, ...props }) {
            return <p className="my-3" {...props}>{children}</p>;
          },
          a({ node, children, href, ...props }) {
            return <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
          },
          // Add handlers for blockquotes and horizontal rules
          blockquote({ node, children, ...props }) {
            return <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-3 text-gray-700 dark:text-gray-300 italic" {...props}>{children}</blockquote>;
          },
          hr({ node, ...props }) {
            return <hr className="my-4 border-gray-300" {...props} />;
          },
          // Add handlers for tables
          table({ node, children, ...props }) {
            return <table className="min-w-full border-collapse my-4" {...props}>{children}</table>;
          },
          thead({ node, children, ...props }) {
            return <thead className="bg-gray-100 dark:bg-gray-800" {...props}>{children}</thead>;
          },
          tbody({ node, children, ...props }) {
            return <tbody {...props}>{children}</tbody>;
          },
          tr({ node, children, ...props }) {
            return <tr className="border-b border-gray-200 dark:border-gray-700" {...props}>{children}</tr>;
          },
          th({ node, children, ...props }) {
            return <th className="px-4 py-2 text-left font-medium" {...props}>{children}</th>;
          },
          td({ node, children, ...props }) {
            return <td className="px-4 py-2" {...props}>{children}</td>;
          },
          // Add handlers for emphasis and strong text
          em({ node, children, ...props }) {
            return <em className="italic" {...props}>{children}</em>;
          },
          strong({ node, children, ...props }) {
            return <strong className="font-bold" {...props}>{children}</strong>;
          }
        }}
        >
        {content}
      </ReactMarkdown>
    </div>
  );
};
export default memo(LatexText);