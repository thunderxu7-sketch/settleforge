import _ from 'lodash';

export function safeEscape(s: string): string {
  return _.escape(s);
}
