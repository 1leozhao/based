import { getSolidityTemplate } from './solidity';
import { getMarkdownTemplate } from './markdown';
import { getJsonTemplate } from './json';
import { getTextTemplate } from './text';

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
    default:
      return '';
  }
}; 