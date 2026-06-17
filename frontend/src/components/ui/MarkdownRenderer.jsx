import React, { useState } from 'react';

// Custom CodeBlock Component with Copy Code functionality
export const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-[var(--border)] bg-[#1a1a24] shadow-md max-w-full font-mono text-[11px] text-left">
      <div className="bg-[#121218] px-3.5 py-1.5 flex items-center justify-between text-gray-400 border-b border-[var(--border)]">
        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="text-[9px] hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md font-semibold cursor-pointer"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-gray-200 leading-relaxed max-w-full whitespace-pre select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Inline Markdown Parser: parses inline backticks `code` and bold **text**
export const renderInlineMarkdown = (text) => {
  const parts = text.split(/(`[^`\n]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="bg-black/25 dark:bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono text-purple-400 font-semibold">
          {part.slice(1, -1)}
        </code>
      );
    }

    const subParts = part.split(/(\*\*[^*]+\*\*)/g);
    return subParts.map((subPart, subIdx) => {
      if (subPart.startsWith('**') && subPart.endsWith('**')) {
        return (
          <strong key={`${idx}-${subIdx}`} className="font-bold text-white">
            {subPart.slice(2, -2)}
          </strong>
        );
      }
      return subPart;
    });
  });
};

// Full Markdown Parser: splits by code blocks first
export const renderMessageText = (text) => {
  if (!text) return '';
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : 'code';
      const code = match ? match[2] : part.slice(3, -3);
      return <CodeBlock key={index} code={code.trim()} language={language} />;
    }
    return (
      <span key={index} className="whitespace-pre-wrap select-text">
        {renderInlineMarkdown(part)}
      </span>
    );
  });
};

export const Markdown = ({ content }) => {
  return <>{renderMessageText(content)}</>;
};

export default Markdown;
