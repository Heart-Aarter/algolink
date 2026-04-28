<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAlgoLinkStore } from '@/stores/algolink'

const route = useRoute()
const store = useAlgoLinkStore()
const theme = ref<'dark' | 'light'>('dark')

const routeTitle = computed(() => {
  if (typeof route.meta.title === 'string') {
    return route.meta.title
  }

  return 'Dashboard'
})

const themeLabel = computed(() => (theme.value === 'dark' ? '夜间' : '日间'))

function applyTheme(nextTheme: 'dark' | 'light') {
  theme.value = nextTheme
  document.documentElement.dataset.theme = nextTheme
  localStorage.setItem('algolink.theme', nextTheme)
}

function setThemeTransitionOrigin(event: MouseEvent) {
  const x = event.clientX
  const y = event.clientY
  const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

  document.documentElement.style.setProperty('--theme-transition-x', `${x}px`)
  document.documentElement.style.setProperty('--theme-transition-y', `${y}px`)
  document.documentElement.style.setProperty('--theme-transition-radius', `${endRadius}px`)
}

function toggleTheme(event: MouseEvent) {
  const nextTheme = theme.value === 'dark' ? 'light' : 'dark'
  const documentWithTransition = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> }
  }

  setThemeTransitionOrigin(event)

  if (!documentWithTransition.startViewTransition) {
    applyTheme(nextTheme)
    return
  }

  document.documentElement.classList.add('theme-transitioning')

  const transition = documentWithTransition.startViewTransition(() => {
    applyTheme(nextTheme)
  })

  transition.finished.finally(() => {
    document.documentElement.classList.remove('theme-transitioning')
  })
}

onMounted(() => {
  const savedTheme = localStorage.getItem('algolink.theme')
  applyTheme(savedTheme === 'light' ? 'light' : 'dark')
})
</script>

<template>
  <header class="app-header">
    <div>
      <p class="eyebrow">AlgoLink 控制台</p>
      <h1>{{ routeTitle }}</h1>
    </div>

    <div class="header-actions">
      <button class="theme-toggle" type="button" :aria-label="`切换${themeLabel}模式`" @click="toggleTheme">
        <span>{{ themeLabel }}</span>
        <i :class="{ light: theme === 'light' }" />
      </button>
      <div class="sync-card">
        <span>公开账号</span>
        <strong>{{ store.accounts.length }}</strong>
      </div>
      <div class="sync-card">
        <span>训练项</span>
        <strong>{{ store.activePlanCount }}</strong>
      </div>
      <RouterLink class="primary-action" to="/accounts">绑定账号</RouterLink>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 82px;
  padding: 0 40px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-header);
  backdrop-filter: blur(18px);
}

.eyebrow {
  margin-bottom: 4px;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  color: var(--color-heading);
  font-size: 23px;
  font-weight: 780;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-panel-muted);
  color: var(--color-text-soft);
  font-size: 13px;
  font-weight: 780;
}

.theme-toggle i {
  position: relative;
  width: 34px;
  height: 18px;
  border-radius: 999px;
  background: rgba(154, 170, 190, 0.18);
}

.theme-toggle i::after {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--color-accent);
  content: '';
  transition: transform 0.18s ease;
}

.theme-toggle i.light::after {
  transform: translateX(16px);
}

.sync-card {
  min-width: 78px;
  padding: 6px 10px;
  border: 1px solid rgba(154, 170, 190, 0.08);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.025);
}

.sync-card span {
  display: block;
  color: var(--color-text-muted);
  font-size: 11px;
}

.sync-card strong {
  color: var(--color-heading);
  font-size: 17px;
  font-weight: 800;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 17px;
  border-radius: 9px;
  background: var(--color-accent);
  color: #071015;
  font-size: 14px;
  font-weight: 820;
}

@media (max-width: 760px) {
  .app-header {
    align-items: flex-start;
    flex-direction: column;
    min-height: auto;
    padding: 20px;
  }

  .header-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .theme-toggle {
    justify-content: space-between;
    grid-column: 1 / -1;
  }

  .primary-action {
    justify-content: center;
    grid-column: 1 / -1;
  }
}
</style>
