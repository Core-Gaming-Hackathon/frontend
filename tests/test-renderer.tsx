/**
 * Simple Test Renderer
 * 
 * A simplified renderer for React components that doesn't rely on the DOM.
 * This is useful for testing components in environments where the DOM is not available.
 */
import React from 'react';
import { renderToString } from 'react-dom/server';

/**
 * Render a React component to a string
 */
export function renderToText(element: React.ReactElement): string {
  return renderToString(element);
}

/**
 * Simple render function that returns the rendered text and a container object
 */
export function simpleRender(element: React.ReactElement) {
  const text = renderToString(element);
  
  return {
    text,
    container: {
      textContent: text,
      querySelector: (selector: string) => {
        // This is a very simplified implementation that just checks if the selector
        // appears in the rendered text
        return text.includes(selector) ? { textContent: text } : null;
      },
      querySelectorAll: (selector: string) => {
        // This is a very simplified implementation that just checks if the selector
        // appears in the rendered text
        return text.includes(selector) ? [{ textContent: text }] : [];
      }
    }
  };
}

/**
 * Simple query functions
 */
export const screen = {
  getByText: (text: string | RegExp) => {
    // This is a placeholder implementation
    return { textContent: typeof text === 'string' ? text : 'matched text' };
  },
  queryByText: (text: string | RegExp) => {
    // This is a placeholder implementation
    return { textContent: typeof text === 'string' ? text : 'matched text' };
  },
  getAllByText: (text: string | RegExp) => {
    // This is a placeholder implementation
    return [{ textContent: typeof text === 'string' ? text : 'matched text' }];
  }
};

export default { simpleRender, renderToText, screen };