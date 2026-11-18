'use client';

import { CopyButton } from '@mantine/core';

import classes from './Prose.module.css';

/**
 * A code block with a label and a Copy button (SPEC 6.18). Lines that start with "#" are shown as
 * comments. No syntax coloring. It scrolls sideways inside itself and never widens the page.
 */
export function CodeBlock({ label, code }: { label: string; code: string }) {
  const lines = code.split('\n');
  return (
    <div className={classes.codeblock}>
      <div className={classes.bar}>
        <span>{label}</span>
        <CopyButton value={code} timeout={1600}>
          {({ copied, copy }) => (
            <button type="button" className="js-only" onClick={copy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </CopyButton>
      </div>
      <pre>
        <code>
          {lines.map((line, i) => (
            <span key={i}>
              {line.trimStart().startsWith('#') ? (
                <span className={classes.comment}>{line}</span>
              ) : (
                line
              )}
              {i < lines.length - 1 ? '\n' : ''}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
