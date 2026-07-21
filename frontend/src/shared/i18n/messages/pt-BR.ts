export const ptBR = {
  'app.title': 'HomeDex',
  'box.title': 'Box {number}',
  'games.title': 'Jogos',
  'entry.title': 'HomeDex',
  'entry.question': 'Você já tem uma coleção?',
  'entry.hasCode': 'Tenho um código',
  'entry.createNew': 'Criar nova coleção',
  'entry.codeLabel': 'Código da coleção',
  'entry.codeHint': 'São 8 caracteres. Não use 0, O, 1 nem I.',
  'entry.confirm': 'Entrar',
  'entry.back': 'Voltar',
} as const

export type MessageKey = keyof typeof ptBR
