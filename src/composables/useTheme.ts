import { computed, ref } from 'vue'

export type AppTheme = 'dark' | 'light'

const storageKey = 'algolink.theme'
const theme = ref<AppTheme>('dark')
const themeLabel = computed(() => (theme.value === 'dark' ? '夜间' : '日间'))

function applyTheme(nextTheme: AppTheme) {
  theme.value = nextTheme

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = nextTheme
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(storageKey, nextTheme)
  }
}

function initTheme() {
  if (typeof localStorage === 'undefined') {
    return
  }

  const savedTheme = localStorage.getItem(storageKey)
  applyTheme(savedTheme === 'light' ? 'light' : 'dark')
}

export function useTheme() {
  return {
    theme,
    themeLabel,
    applyTheme,
    initTheme,
  }
}
