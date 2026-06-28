/**
 * Format AI response text for better readability
 * Preserves original text but adds visual separation for paragraphs
 */
export const formatChatMessage = (text) => {
  if (!text) return '';

  // Split by double newlines (paragraph breaks)
  const paragraphs = text.split(/\n\n+/);

  return paragraphs
    .filter(p => p.trim() !== '') // Remove empty paragraphs
    .map(p => p.trim())
    .join('\n\n'); // Rejoin with consistent paragraph breaks
};

/**
 * Parse message into paragraphs for JSX rendering
 * Returns array of paragraph components
 */
export const renderFormattedMessage = (text) => {
  if (!text) return '';

  // Split by double newlines
  const paragraphs = text
    .split(/\n\n+/)
    .filter(p => p.trim() !== '')
    .map(p => p.trim());

  return paragraphs;
};

/**
 * Add visual enhancement: detect section starts and add spacing
 * Helps distinguish between data summary, insights, and recommendations
 */
export const enhanceMessageReadability = (text) => {
  if (!text) return text;

  // Split into paragraphs and process
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim() !== '');

  return paragraphs;
};

/**
 * Truncate very long messages and add "Read more" option
 * Useful if AI still outputs long responses
 */
export const truncateIfNeeded = (text, maxLines = 15) => {
  const lines = text.split('\n');
  if (lines.length > maxLines) {
    return {
      truncated: lines.slice(0, maxLines).join('\n'),
      full: text,
      hasMore: true,
      moreCount: lines.length - maxLines,
    };
  }
  return {
    truncated: text,
    full: text,
    hasMore: false,
    moreCount: 0,
  };
};

/**
 * Splits message text by [BUBBLE_BREAK] marker to support multiple chat bubbles.
 * Also cleans up any empty/whitespace-only parts.
 */
export const splitMessageByBubbleBreak = (text) => {
  if (!text) return [];
  
  return text
    .split(/\[BUBBLE_BREAK\]/i)
    .map(part => part.trim())
    .filter(part => part.length > 0);
};

