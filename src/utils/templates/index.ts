import { getSolidityTemplate } from './solidity';
import { getMarkdownTemplate } from './markdown';
import { getJsonTemplate } from './json';
import { getTextTemplate } from './text';
import { getJavaScriptTemplate } from './javascript';
import { getTypeScriptTemplate } from './typescript';

export const getDefaultContent = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

  switch (extension) {
    case 'sol':
      return getSolidityTemplate(nameWithoutExt);
    case 'md':
      return getMarkdownTemplate(nameWithoutExt);
    case 'json':
      return getJsonTemplate();
    case 'txt':
      return getTextTemplate();
    case 'js':
      return getJavaScriptTemplate(nameWithoutExt);
    case 'ts':
      return getTypeScriptTemplate(nameWithoutExt);
    default:
      return '';
  }
}; 