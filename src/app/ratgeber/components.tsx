import * as React from 'react';
import type { MDXComponents } from 'mdx/types';

export const mdxComponents: MDXComponents = {
  h1: (props) => (
    <h1 className="font-serif text-display-sm text-navy font-light mt-12 mb-6 first:mt-0" {...props} />
  ),
  h2: (props) => (
    <h2 className="font-serif text-head-lg text-navy font-normal mt-12 mb-4" {...props} />
  ),
  h3: (props) => (
    <h3 className="font-serif text-head-md text-navy font-normal mt-10 mb-3" {...props} />
  ),
  p: (props) => (
    <p className="text-body text-ink leading-relaxed mb-5" {...props} />
  ),
  a: ({ href, ...props }) => (
    <a
      href={href as string}
      className="text-bronze-ink underline decoration-bronze/40 underline-offset-2 hover:decoration-bronze"
      {...props}
    />
  ),
  ul: (props) => (
    <ul className="list-disc pl-6 mb-6 space-y-2 text-body text-ink" {...props} />
  ),
  ol: (props) => (
    <ol className="list-decimal pl-6 mb-6 space-y-2 text-body text-ink" {...props} />
  ),
  li: (props) => (
    <li className="leading-relaxed pl-1" {...props} />
  ),
  blockquote: (props) => (
    <blockquote
      className="border-l-2 border-bronze pl-6 my-8 font-serif italic text-head-sm text-navy"
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="font-mono text-[0.9em] bg-cream border border-stone rounded-sharp px-1.5 py-0.5 text-bronze-ink"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="font-mono text-[0.875rem] bg-navy text-cream rounded-soft p-5 my-6 overflow-x-auto"
      {...props}
    />
  ),
  hr: () => <hr className="border-t border-stone my-10" />,
  strong: (props) => <strong className="font-semibold text-navy" {...props} />,
  em: (props) => <em className="italic text-bronze-ink" {...props} />,
  table: (props) => (
    <div className="my-8 overflow-x-auto">
      <table className="w-full text-body-sm border border-stone rounded-soft overflow-hidden" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-cream" {...props} />,
  th: (props) => (
    <th className="text-left px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-quiet border-b border-stone" {...props} />
  ),
  td: (props) => (
    <td className="px-4 py-3 border-b border-stone text-ink" {...props} />
  ),
};
