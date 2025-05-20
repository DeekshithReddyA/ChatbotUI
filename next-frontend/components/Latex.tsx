//Latex.tsx
import React, { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { prepareLatexContent, containsLatexMath } from '../lib/math-utils';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface PreviewProps {
  content: string;
}

// Helper to detect if a string contains LaTeX but is not wrapped in math delimiters
const needsLatexDelimiters = (text: string): boolean => {
  // If it already has delimiters, don't wrap it again
  if (text.startsWith('$') || text.startsWith('\\(') || text.startsWith('\\[') || 
      text.startsWith('$$') || text.startsWith('\\begin{')) {
    return false;
  }
  
  // Check for common LaTeX expressions that need wrapping
  return /\\frac|\\sum|\\int|\\text|\\left|\\right|\\approx|\\times/g.test(text);
};

// Helper to extract math content from square bracket notation: [ ... ]
const extractMathFromBrackets = (text: string): string => {
  const bracketRegex = /^\s*\[(.*)\]\s*$/;
  const match = text.match(bracketRegex);
  return match ? match[1] : text;
};

const LatexText: React.FC<PreviewProps> = ({ content }: {content: string}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  // Special handling for isolated math expressions
  if (content.trim().startsWith('[') && content.trim().endsWith(']') && containsLatexMath(content)) {
    try {
      const mathContent = extractMathFromBrackets(content.trim());
      const html = katex.renderToString(mathContent, {
        displayMode: true,
        throwOnError: false,
        strict: false
      });
      
      return (
        <div className="preview-content preview-fade w-full overflow-hidden katex-block">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      );
    } catch (e) {
      console.error("KaTeX rendering error:", e);
      // Fall back to regular markdown rendering if KaTeX fails
    }
  }
  
  // Prepare the content for rendering
  const preparedContent = prepareLatexContent(content);
  
  return (
    <div className="preview-content preview-fade w-full overflow-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const code = String(children).replace(/\n$/, '');
            
            if (match) {
              return (
                <div className="relative group">
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
                  <div className="max-h-[500px] overflow-auto">
                    <SyntaxHighlighter 
                      style={vscDarkPlus as any}
                      language={match[1]}
                      showLineNumbers={true}
                      wrapLines={false}
                      customStyle={{ 
                        margin: 0,
                        overflow: 'visible',
                        maxWidth: '100%'
                      }}
                      >
                      {code}
                    </SyntaxHighlighter>
                  </div>
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
            // Special handling for paragraphs that contain only LaTeX
            const childrenArray = React.Children.toArray(children);
            const singleTextChild = childrenArray.length === 1 && typeof childrenArray[0] === 'string';
            
            if (singleTextChild && needsLatexDelimiters(childrenArray[0] as string)) {
              try {
                const mathContent = childrenArray[0] as string;
                const html = katex.renderToString(mathContent, {
                  displayMode: true,
                  throwOnError: false,
                  strict: false
                });
                
                return (
                  <div className="katex-block my-3">
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                  </div>
                );
              } catch (e) {
                // Fallback to normal paragraph if KaTeX fails
                console.error("KaTeX rendering error in paragraph:", e);
              }
            }
            
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
          // Add handlers for tables with improved styling
          table({ node, children, ...props }) {
            return (
              <div className="my-6 w-full overflow-x-auto rounded-md">
                <table className="min-w-full border-collapse border border-gray-600 dark:border-gray-700 rounded-md overflow-hidden bg-gray-700 text-white" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ node, children, ...props }) {
            return (
              <thead 
                className="bg-gray-800 text-white font-medium" 
                {...props}
              >
                {children}
              </thead>
            );
          },
          tbody({ node, children, ...props }) {
            return (
              <tbody 
                className="divide-y divide-gray-600 dark:divide-gray-600 bg-gray-700" 
                {...props}
              >
                {children}
              </tbody>
            );
          },
          tr({ node, children, ...props }) {
            return (
              <tr 
                className="transition-colors hover:bg-gray-600" 
                {...props}
              >
                {children}
              </tr>
            );
          },
          th({ node, children, ...props }) {
            return (
              <th 
                className="px-4 py-3 text-left font-medium border-r border-gray-600 last:border-r-0 text-white" 
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ node, children, ...props }) {
            return (
              <td 
                className="px-4 py-3 border-r border-gray-600 last:border-r-0 text-white" 
                {...props}
              >
                {children}
              </td>
            );
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
        {preparedContent}
      </ReactMarkdown>
    </div>
  );
};
export default memo(LatexText);