import type { MessageKey } from './pt-BR.ts'

export const en: Readonly<Record<MessageKey, string>> = {
  'app.title': 'HomeDex',
  'box.title': 'Box {number}',
  'games.title': 'Games',
  'entry.title': 'HomeDex',
  'entry.question': 'Do you already have a collection?',
  'entry.hasCode': 'I have a code',
  'entry.createNew': 'Create new collection',
  'entry.codeLabel': 'Collection code',
  'entry.codeHint': 'It has 8 characters. Do not use 0, O, 1 or I.',
  'entry.confirm': 'Enter',
  'common.loading': 'Loading...',
  'entry.error.notFound': 'Code not found. Check it and try again.',
  'entry.error.invalidCode': 'Invalid code. Check the 8 characters.',
  'entry.error.network': 'Could not reach the server. Check your connection.',
  'entry.error.generic': 'Something went wrong. Try again.',
  'collection.codeLabel': 'Your collection code',
  'collection.leave': 'Switch collection',
  'entry.back': 'Back',
}
