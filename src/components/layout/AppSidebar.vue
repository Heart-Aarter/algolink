<script setup lang="ts">
import { RouterLink } from 'vue-router'

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'D' },
  { path: '/accounts', label: 'OJ 账号绑定', icon: 'O' },
  { path: '/submissions', label: '提交记录', icon: 'S' },
  { path: '/profile', label: '能力画像', icon: 'P' },
  { path: '/ai-advice', label: 'AI 训练建议', icon: 'A' },
  { path: '/training-plan', label: '训练计划', icon: 'T' },
  { path: '/settings', label: '设置', icon: 'G' },
]
</script>

<template>
  <aside class="app-sidebar">
    <RouterLink class="brand" to="/">
      <span class="brand-mark">AL</span>
      <span>
        <strong>AlgoLink</strong>
        <small>刷题数据分析平台</small>
      </span>
    </RouterLink>

    <nav class="nav-list" aria-label="主导航">
      <RouterLink v-for="item in navItems" :key="item.path" class="nav-item" :to="item.path">
        <span class="nav-icon">{{ item.icon }}</span>
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="sidebar-note">
      <span>Mock Mode</span>
      <p>当前仅使用公开 handle 与 localStorage 数据。</p>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 24px 18px;
  border-right: 1px solid var(--color-border);
  background: #07101f;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  color: var(--color-heading);
}

.brand:hover {
  background: transparent;
}

.brand-mark {
  display: inline-grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid rgba(37, 226, 211, 0.45);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(37, 226, 211, 0.2), rgba(79, 140, 255, 0.24));
  color: var(--color-accent);
  font-size: 14px;
  font-weight: 900;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  font-size: 19px;
  font-weight: 900;
}

.brand small {
  color: var(--color-text-muted);
  font-size: 12px;
}

.nav-list {
  display: grid;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--color-text-soft);
  font-size: 14px;
  font-weight: 700;
}

.nav-item:hover,
.nav-item.router-link-active {
  border-color: rgba(37, 226, 211, 0.25);
  background: rgba(37, 226, 211, 0.1);
  color: var(--color-heading);
}

.nav-icon {
  display: inline-grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 900;
}

.sidebar-note {
  margin-top: auto;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
}

.sidebar-note span {
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 900;
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
    min-height: auto;
    padding: 16px;
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
