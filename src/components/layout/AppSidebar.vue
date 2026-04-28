<script setup lang="ts">
import { RouterLink } from 'vue-router'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '01' },
  { path: '/accounts', label: 'OJ 账号绑定', icon: '02' },
  { path: '/submissions', label: '提交记录', icon: '03' },
  { path: '/profile', label: '能力画像', icon: '04' },
  { path: '/ai-advice', label: 'AI 训练建议', icon: '05' },
  { path: '/training-report', label: '训练报告', icon: '06' },
  { path: '/training-plan', label: '训练计划', icon: '07' },
  { path: '/settings', label: '设置', icon: '08' },
]
</script>

<template>
  <aside class="app-sidebar">
    <RouterLink class="brand" to="/">
      <span class="brand-mark">AL</span>
      <span>
        <strong>AlgoLink</strong>
        <small>AI 多 OJ 数据分析</small>
      </span>
    </RouterLink>

    <nav class="nav-list" aria-label="主导航">
      <RouterLink v-for="item in navItems" :key="item.path" class="nav-item" :to="item.path">
        <span class="nav-icon">{{ item.icon }}</span>
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="sidebar-note">
      <span>Mock Data</span>
      <p>仅使用公开 handle，mock 数据与同步结果保存到 localStorage。</p>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  align-self: start;
  min-height: 100vh;
  max-height: 100vh;
  padding: 24px 16px;
  overflow-y: auto;
  border-right: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.018), transparent 36%), var(--color-sidebar);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
  padding: 0 6px;
  color: var(--color-heading);
}

.brand:hover {
  background: transparent;
}

.brand-mark {
  display: inline-grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  background:
    linear-gradient(135deg, var(--glass-highlight), transparent 46%), rgba(255, 255, 255, 0.035);
  color: var(--color-heading);
  font-size: 14px;
  font-weight: 850;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
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

.nav-list {
  display: grid;
  gap: 6px;
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
  border-radius: 9px;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 690;
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
  border-color: rgba(102, 214, 203, 0.24);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.12), transparent 48%), var(--glass-surface-strong);
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
  font-size: 11px;
  font-weight: 780;
}

.nav-item > :not(.nav-icon),
.nav-item .nav-icon {
  position: relative;
  z-index: 1;
}

.nav-item.router-link-active .nav-icon {
  background: rgba(102, 214, 203, 0.12);
  color: var(--color-heading);
}

.sidebar-note {
  margin-top: auto;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent 45%), rgba(255, 255, 255, 0.025);
  backdrop-filter: blur(14px);
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

@media (max-width: 960px) {
  .app-sidebar {
    position: relative;
    max-height: none;
    min-height: auto;
    padding: 16px;
    overflow: visible;
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
