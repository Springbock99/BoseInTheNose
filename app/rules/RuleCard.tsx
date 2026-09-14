'use client';

import { useState } from 'react';
import { highlightSegments } from './highlight';
import type { Rule, TableBlock } from './types';

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  // Segments are rendered as React nodes, never as an HTML string.
  return (
    <>
      {highlightSegments(text, terms).map((segment, index) =>
        segment.hit ? (
          <mark key={index} className="rounded-[2px] bg-[#62dfff]/25 px-0.5 text-white">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

function RuleTable({ block, terms }: { block: TableBlock; terms: string[] }) {
  const [header, ...rows] = block.rows;
  return (
    // Wide tables scroll inside their own container so the page never scrolls
    // horizontally on mobile.
    <div className="-mx-1 overflow-x-auto py-1">
      <table className="w-full min-w-[22rem] border-collapse text-sm">
        <thead>
          <tr>
            {header.map((cell, index) => (
              <th
                key={index}
                scope="col"
                className="border-b border-white/15 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-[#62dfff]"
              >
                <Highlighted text={cell} terms={terms} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-white/[0.06]">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`px-3 py-2 align-top leading-6 ${
                    cellIndex === 0 ? 'text-white/72' : 'font-mono text-white/58'
                  }`}
                >
                  <Highlighted text={cell} terms={terms} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RuleCard({
  rule,
  terms,
  isTarget,
}: {
  rule: Rule;
  terms: string[];
  isTarget: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/rules#${rule.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard is unavailable over plain http on some browsers; the anchor
      // in the address bar still works, so this failure is not worth surfacing.
    }
  };

  return (
    <article
      id={rule.id}
      className={`scroll-mt-28 border-l-2 py-5 pl-5 transition-colors duration-500 ${
        isTarget ? 'border-[#62dfff] bg-[#62dfff]/[0.06]' : 'border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-black text-white">
          <span className="mr-2.5 font-mono text-sm font-bold text-[#62dfff]">{rule.id}</span>
          <Highlighted text={rule.title} terms={terms} />
        </h3>
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 transition hover:border-[#62dfff]/40 hover:text-[#62dfff]"
        >
          {copied ? 'Copied' : 'Link'}
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {rule.blocks.map((block, index) =>
          block.type === 'table' ? (
            <RuleTable key={index} block={block} terms={terms} />
          ) : block.type === 'li' ? (
            <p key={index} className="flex gap-3 pl-1 text-sm leading-7 text-white/58">
              <span aria-hidden className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#a78bfa]" />
              <span>
                <Highlighted text={block.text} terms={terms} />
              </span>
            </p>
          ) : (
            <p key={index} className="text-sm leading-7 text-white/68">
              <Highlighted text={block.text} terms={terms} />
            </p>
          ),
        )}
      </div>
    </article>
  );
}
