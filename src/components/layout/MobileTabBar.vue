<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { NIcon } from 'naive-ui'
import { Bulb, Calendar, Home, List, Person } from '@vicons/ionicons5'

const route = useRoute()

const moreRouteNames = new Set([
  'profile',
  'accounts',
  'ability-profile',
  'training-report',
  'daily',
  'leaderboard',
  'settings',
  'about',
])

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home, match: ['dashboard'] },
  { path: '/submissions', label: '提交', icon: List, match: ['submissions'] },
  { path: '/ai-advice', label: 'Coach', icon: Bulb, match: ['ai-advice'] },
  { path: '/training-plan', label: '计划', icon: Calendar, match: ['training-plan'] },
  { path: '/profile', label: '我的', icon: Person, match: [...moreRouteNames] },
]

const activeName = computed(() => String(route.name ?? ''))
</script>

<template>
  <nav class="mobile-tab-bar" aria-label="手机端主导航">
    <RouterLink
      v-for="item in navItems"
      :key="item.path"
      class="mobile-tab-item"
      :class="{ active: item.match.includes(activeName) }"
      :to="item.path"
    >
      <span class="mobile-tab-icon" aria-hidden="true">
        <n-icon :component="item.icon" />
      </span>
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.mobile-tab-bar {
  position: fixed;
  right: 12px;
  bottom: calc(10px + env(safe-area-inset-bottom));
  left: 12px;
  z-index: 60;
  display: none;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  min-height: 64px;
  padding: 7px;
  overflow: hidden;
  border: 1px solid rgba(194, 138, 46, 0.32);
  border-radius: 18px;
  background:
    linear-gradient(90deg, rgba(142, 39, 36, 0.16), transparent 5px),
    linear-gradient(180deg, var(--glass-highlight), transparent 62%),
    var(--color-header);
  box-shadow:
    var(--shadow-elevated),
    inset 0 1px 0 var(--glass-highlight);
  backdrop-filter: blur(18px) saturate(140%);
}

.mobile-tab-bar::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(194, 138, 46, 0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(140, 171, 159, 0.07) 1px, transparent 1px);
  background-size: 18px 18px;
  content: '';
  opacity: 0.44;
  pointer-events: none;
}

.mobile-tab-item {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 3px;
  min-width: 0;
  min-height: 50px;
  border: 1px solid transparent;
  border-radius: 13px;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 820;
}

.mobile-tab-icon {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 9px;
  color: var(--color-text-soft);
  font-size: 19px;
}

.mobile-tab-item.active {
  border-color: rgba(194, 138, 46, 0.42);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.16), transparent 46%),
    rgba(194, 138, 46, 0.14);
  color: var(--color-heading);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.mobile-tab-item.active .mobile-tab-icon {
  color: var(--color-gold);
}

@media (max-width: 760px) {
  .mobile-tab-bar {
    display: grid;
  }
}
</style>
