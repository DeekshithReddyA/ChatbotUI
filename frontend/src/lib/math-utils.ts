/**
 * Utility functions for handling math and LaTeX content
 */

/**
 * Prepares a string for LaTeX processing by fixing common escaping issues
 * @param rawContent The raw content string to prepare
 * @returns A string with proper LaTeX escaping
 */
export function prepareLatexContent(rawContent: string): string {
  // Handle escaped brackets and braces for LaTeX display mode
  let prepared = rawContent
    // Fix escaped delimiters for display math
    .replace(/\\\[/g, '$$')        // Replace \[ with $$
    .replace(/\\\]/g, '$$')        // Replace \] with $$
    .replace(/\\\\(?=\[)/g, '\\[') // But keep \\[ as \[
    .replace(/\\\\(?=\])/g, '\\]') // But keep \\] as \]
    
    // Fix escaped parentheses for inline math
    .replace(/\\\(/g, '$')         // Replace \( with $
    .replace(/\\\)/g, '$')         // Replace \) with $
    .replace(/\\\\(?=\()/g, '\\(') // But keep \\( as \(
    .replace(/\\\\(?=\))/g, '\\)') // But keep \\) as \)
    
    // Fix escaped dollar signs for LaTeX math
    .replace(/\\\$/g, '$')        // Replace \$ with $ for math delimiters
    .replace(/\\\\\$/g, '\\$')    // But keep \\$ as \$ for literal dollar signs
    
    // Fix common LaTeX commands that might be escaped incorrectly
    .replace(/\\\\(?=\\frac)/g, '\\')   // Fix \\\frac
    .replace(/\\\\(?=\\sum)/g, '\\')    // Fix \\\sum
    .replace(/\\\\(?=\\int)/g, '\\')    // Fix \\\int
    .replace(/\\\\(?=\\text)/g, '\\')   // Fix \\\text
    .replace(/\\\\(?=\\left)/g, '\\')   // Fix \\\left
    .replace(/\\\\(?=\\right)/g, '\\')  // Fix \\\right
    .replace(/\\\\(?=\\approx)/g, '\\') // Fix \\\approx
    .replace(/\\\\(?=\\times)/g, '\\'); // Fix \\\times
    
  // Clean up any double dollar signs that might have been created
  prepared = prepared
    .replace(/\$\$/g, '$$')
    .replace(/\$\$\$/g, '$$');
  
  // Convert [LaTeX] to $$LaTeX$$ for display math - detect standalone brackets
  if (/^\s*\[.+\]\s*$/.test(prepared)) {
    prepared = prepared.replace(/^\s*\[(.*)\]\s*$/, '$$$$1$$');
  }
  
  return prepared;
}

/**
 * Detects if a string contains LaTeX math content
 * @param content The content to check for LaTeX math
 * @returns True if the content likely contains LaTeX math
 */
export function containsLatexMath(content: string): boolean {
  // Common LaTeX delimiters
  const latexDelimiters = [
    /\$\$.+?\$\$/s,                 // Display math: $$...$$
    /\$.+?\$/g,                     // Inline math: $...$
    /\\\[.+?\\\]/s,                 // Display math: \[...\]
    /\\\(.+?\\\)/s,                 // Inline math: \(...\)
    /\[\\text\{.+?\}\]/s,           // Text inside brackets: [\text{...}]
    /\[.+?\\frac\{.+?\}\{.+?\}.+?\]/s, // Bracket with frac: [...\frac{...}{...}...]
    
    // Common LaTeX commands
    /\\frac\{.+?\}\{.+?\}/s,        // Fractions
    /\\sum/,                        // Summation
    /\\int/,                        // Integral
    /\\sqrt/,                       // Square root
    /\\overline/,                   // Overline
    /\\underline/,                  // Underline
    /\\text\{.+?\}/,                // Text command
    /\\left[\\(\\[].*\\right[\\)\\]]/s,  // \left and \right paired commands
    /\\begin\{.+?\}.+?\\end\{.+?\}/s     // Environment: \begin{...}...\end{...}
  ];
  
  return latexDelimiters.some(regex => regex.test(content));
}

/**
 * Determines if a content should be treated as markdown with LaTeX
 * or as plain text
 * @param content The content to analyze
 * @returns True if content should be treated as markdown with LaTeX
 */
export function shouldRenderAsLatex(content: string): boolean {
  // Common mathematics elements to detect
  const mathTerms = [
    'frac', 'sqrt', 'sum', 'int', 'approx', 'times', 'text', 
    'left', 'right', 'begin', 'end', '\\\\', '\\cdot', '\\pi'
  ];
  
  // Check for standalone square brackets containing math
  if (/^\s*\[.*\\.*\]\s*$/.test(content)) {
    return true;
  }
  
  // Check for math terms
  if (mathTerms.some(term => content.includes(`\\${term}`))) {
    return true;
  }
  
  // Check for LaTeX math
  if (containsLatexMath(content)) {
    return true;
  }
  
  // Check for markdown features (headers, lists, code blocks, etc.)
  const markdownFeatures = [
    /^#{1,6}\s+/m,         // Headers
    /^\s*[*+-]\s+/m,       // Unordered lists
    /^\s*\d+\.\s+/m,       // Ordered lists
    /^>\s+/m,              // Blockquotes
    /`{3}[\s\S]*?`{3}/m,   // Code blocks with ```
    /\[.+?\]\(.+?\)/m,     // Links
    /!\[.+?\]\(.+?\)/m,    // Images
    /\|.+?\|.+?\|/m,       // Tables
    /^-{3,}/m,             // Horizontal rules ---
    /^_{3,}/m,             // Horizontal rules ___
    /^={3,}/m              // Header underlines ===
  ];
  
  return markdownFeatures.some(regex => regex.test(content));
} 