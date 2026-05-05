<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { NIcon } from 'naive-ui'
import {
  Analytics,
  Bulb,
  Calendar,
  ChevronBack,
  ChevronForward,
  DocumentText,
  List,
  Person,
  Rocket,
  Settings,
  StatsChart,
  Today,
  Trophy,
} from '@vicons/ionicons5'

defineProps<{
  collapsed: boolean
}>()

defineEmits<{
  toggle: []
}>()

const navItems = [
  { path: '/', label: 'Dashboard', icon: StatsChart },
  { path: '/accounts', label: 'OJ 账号绑定', icon: Person },
  { path: '/submissions', label: '提交记录', icon: List },
  { path: '/profile', label: '能力画像', icon: Analytics },
  { path: '/ai-advice', label: 'AI 训练建议', icon: Bulb },
  { path: '/training-report', label: '训练报告', icon: DocumentText },
  { path: '/training-plan', label: '训练计划', icon: Calendar },
  { path: '/daily', label: '每日一题', icon: Today },
  { path: '/leaderboard', label: '排行榜', icon: Trophy },
  { path: '/about', label: '关于项目', icon: Rocket },
  { path: '/settings', label: '设置', icon: Settings },
]
</script>

<template>
  <aside class="app-sidebar" :class="{ collapsed }">
    <RouterLink class="brand" to="/">
      <span class="brand-mark">AL</span>
      <span class="brand-text">
        <strong>AlgoLink</strong>
        <small>AI 多 OJ 数据平台</small>
      </span>
    </RouterLink>

    <button
      class="sidebar-toggle"
      type="button"
      :aria-label="collapsed ? '展开菜单' : '折叠菜单'"
      @click="$emit('toggle')"
    >
      <n-icon :component="collapsed ? ChevronForward : ChevronBack" />
      <span>{{ collapsed ? '展开' : '折叠' }}</span>
    </button>

    <nav class="nav-list" aria-label="主导航">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :to="item.path"
        :title="collapsed ? item.label : undefined"
      >
        <span class="nav-icon" aria-hidden="true">
          <n-icon :component="item.icon" />
        </span>
        <span class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-note">
      <span>SQLite + Cache</span>
      <p>仅绑定公开 handle，公开同步数据写入后端 SQLite，localStorage 保留离线可用缓存。</p>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  --sidebar-motion: 0.34s cubic-bezier(0.2, 0.72, 0.18, 1);

  position: sticky;
  top: 0;
  z-index: 22;
  display: flex;
  flex-direction: column;
  align-self: start;
  min-height: 100vh;
  max-height: 100vh;
  padding: 24px 16px;
  overflow-y: auto;
  border-right: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, transparent 0 calc(100% - 8px), var(--stripe-red) calc(100% - 8px) calc(100% - 5px), var(--stripe-gold) calc(100% - 5px) calc(100% - 2px), var(--stripe-teal) calc(100% - 2px)),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045), transparent 24%),
    var(--color-sidebar);
  box-shadow:
    18px 0 48px rgba(0, 0, 0, 0.2),
    inset -1px 0 0 rgba(194, 138, 46, 0.12);
  backdrop-filter: blur(8px);
  transition:
    padding var(--sidebar-motion),
    box-shadow var(--sidebar-motion);
}

.app-sidebar::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(155, 177, 205, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(155, 177, 205, 0.028) 1px, transparent 1px);
  background-size: 28px 28px;
  content: '';
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.66), transparent 86%);
  pointer-events: none;
}

.brand {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
  padding: 0 6px;
  color: var(--color-heading);
  min-width: 0;
  transition:
    gap var(--sidebar-motion),
    margin var(--sidebar-motion),
    padding var(--sidebar-motion);
}

.brand:hover {
  background: transparent;
}

.brand-mark {
  position: relative;
  display: inline-grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgba(194, 138, 46, 0.38);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.18), transparent 46%),
    linear-gradient(160deg, rgba(142, 39, 36, 0.18), rgba(194, 138, 46, 0.13));
  color: var(--color-heading);
  font-size: 14px;
  font-weight: 850;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 14px 32px rgba(0, 0, 0, 0.14);
  flex: 0 0 auto;
  transition:
    width var(--sidebar-motion),
    height var(--sidebar-motion),
    box-shadow var(--sidebar-motion);
}

.brand-text {
  min-width: 0;
  max-width: 160px;
  overflow: hidden;
  white-space: nowrap;
  opacity: 1;
  transform: translateX(0);
  transition:
    max-width var(--sidebar-motion),
    opacity 0.2s ease,
    transform var(--sidebar-motion);
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  font-size: 19px;
  font-weight: 850;
}

.brand small {
  color: var(--color-text-muted);
  font-size: 12px;
}

.sidebar-toggle {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  margin: 0 0 18px;
  padding: 0 12px;
  border: 1px solid rgba(194, 138, 46, 0.32);
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(142, 39, 36, 0.1), transparent 5px),
    var(--glass-surface);
  color: var(--color-text-soft);
  font-size: 13px;
  font-weight: 800;
  overflow: hidden;
  transition:
    width var(--sidebar-motion),
    padding var(--sidebar-motion),
    margin var(--sidebar-motion),
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.sidebar-toggle:hover {
  border-color: var(--color-border-strong);
  color: var(--color-heading);
  transform: translateY(-1px);
}

.sidebar-toggle .n-icon {
  flex: 0 0 auto;
  font-size: 17px;
}

.sidebar-toggle span {
  max-width: 48px;
  overflow: hidden;
  white-space: nowrap;
  opacity: 1;
  transform: translateX(0);
  transition:
    max-width var(--sidebar-motion),
    opacity 0.18s ease,
    transform var(--sidebar-motion);
}

.nav-list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 6px;
  transition: justify-items var(--sidebar-motion);
}

.nav-item {
  position: relative;
  z-index: 0;
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 42px;
  padding: 0 11px;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 690;
  transition:
    width var(--sidebar-motion),
    padding var(--sidebar-motion),
    gap var(--sidebar-motion),
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.nav-item::before {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(135deg, var(--glass-highlight), transparent 44%), var(--glass-surface);
  content: '';
  opacity: 0;
  transition: opacity 0.22s ease;
}

.nav-item:hover {
  color: var(--color-text);
  transform: translateX(2px);
}

.nav-item:hover::before {
  opacity: 0.66;
}

.nav-item.router-link-active {
  border-color: rgba(194, 138, 46, 0.38);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.14), transparent 48%),
    linear-gradient(90deg, rgba(142, 39, 36, 0.2), transparent 5px),
    var(--glass-surface-strong);
  color: var(--color-heading);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.nav-item.router-link-active::before {
  opacity: 0;
}

.nav-icon {
  position: relative;
  z-index: 1;
  display: inline-grid;
  width: 28px;
  height: 24px;
  place-items: center;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.035);
  color: var(--color-text-muted);
  font-size: 17px;
  flex: 0 0 auto;
  transition:
    width var(--sidebar-motion),
    background-color 0.2s ease,
    color 0.2s ease;
}

.nav-item > :not(.nav-icon),
.nav-item .nav-icon {
  position: relative;
  z-index: 1;
}

.nav-label {
  min-width: 0;
  max-width: 168px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 1;
  transform: translateX(0);
  transition:
    max-width var(--sidebar-motion),
    opacity 0.18s ease,
    transform var(--sidebar-motion);
}

.nav-item.router-link-active .nav-icon {
  background: rgba(194, 138, 46, 0.16);
  color: var(--color-heading);
}

.sidebar-note {
  position: relative;
  z-index: 1;
  margin-top: auto;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent 45%), rgba(255, 255, 255, 0.025);
  backdrop-filter: blur(14px);
  max-height: 180px;
  overflow: hidden;
  opacity: 1;
  transform: translateY(0);
  transition:
    max-height var(--sidebar-motion),
    margin var(--sidebar-motion),
    padding var(--sidebar-motion),
    opacity 0.18s ease,
    transform var(--sidebar-motion),
    border-color 0.2s ease;
}

.sidebar-note span {
  color: var(--color-text-soft);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.sidebar-note p {
  margin-top: 6px;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.app-sidebar.collapsed {
  padding: 24px 10px;
  box-shadow:
    12px 0 34px rgba(0, 0, 0, 0.16),
    inset -1px 0 0 rgba(194, 138, 46, 0.1);
}

.app-sidebar.collapsed .brand {
  justify-content: center;
  gap: 0;
  margin-bottom: 20px;
  padding: 0;
}

.app-sidebar.collapsed .brand-text,
.app-sidebar.collapsed .nav-label,
.app-sidebar.collapsed .sidebar-toggle span {
  max-width: 0;
  opacity: 0;
  transform: translateX(-6px);
  pointer-events: none;
}

.app-sidebar.collapsed .brand-text {
  transform: translateX(-8px);
}

.app-sidebar.collapsed .nav-label {
  transform: translateX(-10px);
}

.app-sidebar.collapsed .sidebar-note {
  max-height: 0;
  margin-top: auto;
  padding-top: 0;
  padding-bottom: 0;
  border-color: transparent;
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
}

.app-sidebar.collapsed .brand-mark {
  width: 42px;
  height: 42px;
}

.app-sidebar.collapsed .sidebar-toggle {
  width: 42px;
  margin: 0 auto 18px;
  padding: 0;
}

.app-sidebar.collapsed .nav-list {
  justify-items: center;
}

.app-sidebar.collapsed .nav-item {
  justify-content: center;
  gap: 0;
  width: 46px;
  padding: 0;
}

.app-sidebar.collapsed .nav-icon {
  width: 30px;
}

@media (max-width: 960px) {
  .app-sidebar {
    position: relative;
    max-height: none;
    min-height: auto;
    padding: 16px;
    overflow: visible;
  }

  .app-sidebar.collapsed {
    padding: 16px;
  }

  .app-sidebar.collapsed .brand-text,
  .app-sidebar.collapsed .nav-label,
  .app-sidebar.collapsed .sidebar-toggle span {
    max-width: 168px;
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  .app-sidebar.collapsed .sidebar-toggle span {
    max-width: 48px;
  }

  .app-sidebar.collapsed .brand {
    justify-content: flex-start;
  }

  .app-sidebar.collapsed .sidebar-toggle {
    width: 100%;
  }

  .app-sidebar.collapsed .nav-list {
    justify-items: stretch;
  }

  .app-sidebar.collapsed .nav-item {
    justify-content: flex-start;
    width: auto;
    padding: 0 11px;
  }

  .nav-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sidebar-note {
    display: none;
  }
}

@media (max-width: 560px) {
  .nav-list {
    grid-template-columns: 1fr;
  }
}
</style>
