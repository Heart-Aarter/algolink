<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { NIcon } from 'naive-ui'
import { Moon, Sunny } from '@vicons/ionicons5'
import { useTheme } from '@/composables/useTheme'
import { useAlgoLinkStore } from '@/stores/algolink'

const route = useRoute()
const store = useAlgoLinkStore()
const { theme, themeLabel, applyTheme, initTheme } = useTheme()

const routeTitle = computed(() => {
  if (typeof route.meta.title === 'string') {
    return route.meta.title
  }

  return 'Dashboard'
})
const mobileThemeIcon = computed(() => (theme.value === 'dark' ? Sunny : Moon))
const loginRoute = computed(() => ({
  path: store.currentUserId ? '/profile' : '/login',
  query: store.currentUserId
    ? undefined
    : {
        redirect: route.fullPath,
      },
}))

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
  initTheme()
})
</script>

<template>
  <header class="app-header">
    <div class="header-title">
      <span class="mobile-brand-mark" aria-hidden="true">AL</span>
      <p class="eyebrow">AlgoLink 控制台</p>
      <h1>{{ routeTitle }}</h1>
    </div>

    <div class="header-actions">
      <RouterLink class="user-tag" :to="loginRoute">
        <img
          v-if="store.currentUserAvatar"
          class="user-tag-avatar"
          :src="store.currentUserAvatar"
          :alt="`${store.currentUsername} avatar`"
        >
        <span v-else class="user-tag-avatar">{{ store.currentUsername.slice(0, 1).toUpperCase() }}</span>
        <span class="user-tag-name">{{ store.currentUsername }}</span>
      </RouterLink>
      <button
        class="theme-toggle"
        type="button"
        :aria-label="`切换${themeLabel}模式`"
        @click="toggleTheme"
      >
        <n-icon class="mobile-theme-icon" :component="mobileThemeIcon" />
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
      <div v-if="store.serverSyncMessage" class="sync-card server-warning">
        <span>Sync</span>
        <strong>{{ store.serverSyncMessage }}</strong>
      </div>
      <RouterLink class="primary-action" to="/accounts">绑定账号</RouterLink>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 86px;
  padding: 0 40px;
  border-bottom: 1px solid var(--color-border);
  background:
    linear-gradient(90deg, rgba(142, 39, 36, 0.08), transparent 5px),
    linear-gradient(90deg, rgba(194, 138, 46, 0.07), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent), var(--color-header);
  box-shadow:
    0 16px 42px rgba(0, 0, 0, 0.16),
    inset 0 -1px 0 rgba(194, 138, 46, 0.12);
  backdrop-filter: blur(10px);
}

.app-header::after {
  position: absolute;
  right: 40px;
  bottom: -1px;
  width: min(42vw, 520px);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--stripe-red), var(--stripe-gold), var(--stripe-teal));
  content: '';
  opacity: 0.72;
}

.header-title {
  min-width: 0;
}

.mobile-brand-mark,
.mobile-theme-icon {
  display: none;
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
  font-size: 25px;
  font-weight: 840;
  line-height: 1.16;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-tag {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  background:
    linear-gradient(135deg, var(--glass-highlight), transparent 42%), var(--glass-surface);
  color: var(--color-text-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px) saturate(130%);
  cursor: pointer;
}

.user-tag:hover {
  transform: translateY(-1px);
}

.user-tag-avatar {
  display: inline-grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 999px;
  background: rgba(194, 138, 46, 0.18);
  color: var(--color-heading);
  font-size: 12px;
  font-weight: 800;
  object-fit: cover;
}

.user-tag-name {
  color: var(--color-heading);
  font-size: 13px;
  font-weight: 720;
}

.theme-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  background:
    linear-gradient(135deg, var(--glass-highlight), transparent 42%), var(--glass-surface);
  color: var(--color-text-soft);
  font-size: 13px;
  font-weight: 780;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px) saturate(130%);
}

.theme-toggle:hover,
.primary-action:hover,
.sync-card:hover {
  transform: translateY(-1px);
}

.theme-toggle i {
  position: relative;
  width: 34px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(155, 177, 205, 0.14);
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
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.055), transparent 42%), rgba(255, 255, 255, 0.025);
  backdrop-filter: blur(12px);
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

.server-warning {
  max-width: 220px;
}

.server-warning strong {
  display: block;
  overflow: hidden;
  color: var(--color-warning);
  font-size: 12px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 17px;
  border: 1px solid rgba(194, 138, 46, 0.38);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.38), transparent 44%), var(--color-accent);
  color: #071015;
  font-size: 14px;
  font-weight: 820;
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

@media (max-width: 760px) {
  .app-header {
    align-items: center;
    flex-direction: row;
    min-height: auto;
    gap: 12px;
    padding: calc(12px + env(safe-area-inset-top)) 14px 12px;
    border-bottom-color: rgba(194, 138, 46, 0.26);
    background:
      linear-gradient(90deg, rgba(142, 39, 36, 0.16), transparent 5px),
      linear-gradient(180deg, var(--glass-highlight), transparent 62%),
      var(--color-header);
    box-shadow:
      var(--shadow-panel),
      inset 0 -1px 0 rgba(194, 138, 46, 0.16);
  }

  .app-header::after {
    right: 14px;
    left: 14px;
    width: auto;
    background: linear-gradient(90deg, var(--stripe-red), var(--stripe-gold), var(--stripe-teal));
    opacity: 0.84;
  }

  .header-title {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    align-items: center;
    column-gap: 10px;
    flex: 1 1 auto;
  }

  .mobile-brand-mark {
    display: grid;
    width: 38px;
    height: 38px;
    grid-row: 1 / span 2;
    place-items: center;
    border: 1px solid rgba(194, 138, 46, 0.48);
    border-radius: 12px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.18), transparent 42%),
      rgba(194, 138, 46, 0.12);
    color: var(--color-heading);
    font-size: 12px;
    font-weight: 900;
    box-shadow: 0 0 24px rgba(194, 138, 46, 0.12);
  }

  .eyebrow {
    margin-bottom: 1px;
    font-size: 10px;
  }

  h1 {
    min-width: 0;
    overflow: hidden;
    font-size: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-actions {
    display: flex;
    gap: 8px;
    flex: 0 0 auto;
  }

  .user-tag {
    min-height: 38px;
    width: 38px;
    padding: 0;
    justify-content: center;
  }

  .user-tag-name,
  .theme-toggle span,
  .theme-toggle i,
  .sync-card,
  .primary-action {
    display: none;
  }

  .theme-toggle {
    width: 38px;
    min-height: 38px;
    justify-content: center;
    padding: 0;
    border-radius: 12px;
  }

  .mobile-theme-icon {
    display: inline-flex;
    color: var(--color-gold);
    font-size: 19px;
  }
}
</style>
