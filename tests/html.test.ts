import { describe, it, expect } from 'vitest';
import { html, raw, toHtml } from '@/ui/html';

describe('html templating (XSS safety)', () => {
  it('escapes interpolated user input by default', () => {
    const evil = '<script>alert(1)</script>';
    const out = toHtml(html`<div>${evil}</div>`);
    expect(out).toBe('<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>');
  });

  it('escapes quotes and ampersands', () => {
    const out = toHtml(html`<p>${'a & "b" \'c\''}</p>`);
    expect(out).toContain('&amp;');
    expect(out).toContain('&quot;');
    expect(out).toContain('&#039;');
  });

  it('passes raw() content through untouched', () => {
    const out = toHtml(html`<div>${raw('<b>bold</b>')}</div>`);
    expect(out).toBe('<div><b>bold</b></div>');
  });

  it('joins arrays of nested templates', () => {
    const items = ['a', 'b', 'c'];
    const out = toHtml(html`${items.map((i) => html`<li>${i}</li>`)}`);
    expect(out).toBe('<li>a</li><li>b</li><li>c</li>');
  });

  it('renders null/false/undefined as empty', () => {
    expect(toHtml(html`${null}${false}${undefined}x`)).toBe('x');
  });
});
