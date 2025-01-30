export const WORKER_LEVEL_NAMES = {
  level1: 'Hominid',
  level2: 'Mimic',
  level3: 'Talker',
  level4: 'Storyleer'
} as const

export const getThinkingTitle = (level: string): string => {
  const levelName = WORKER_LEVEL_NAMES[level as keyof typeof WORKER_LEVEL_NAMES]
  return `${levelName} Thinking`
}

export const getWorkerLevelName = (level: string): string => {
  return WORKER_LEVEL_NAMES[level as keyof typeof WORKER_LEVEL_NAMES]
}
