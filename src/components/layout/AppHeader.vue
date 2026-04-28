<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAlgoLinkStore } from '@/stores/algolink'

const route = useRoute()
const store = useAlgoLinkStore()

const routeTitle = computed(() => {
  if (typeof route.meta.title === 'string') {
    return route.meta.title
  }

  return 'Dashboard'
})
</script>

<template>
  <header class="app-header">
    <div>
      <p class="eyebrow">AI Multi-OJ Analytics</p>
      <h1>{{ routeTitle }}</h1>
    </div>

    <div class="header-actions">
      <div class="sync-card">
        <span>公开账号</span>
        <strong>{{ store.accounts.length }}</strong>
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
  min-height: 88px;
  padding: 0 32px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(8, 15, 31, 0.86);
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
  font-size: 24px;
  font-weight: 800;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sync-card {
  min-width: 108px;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
}

.sync-card span {
  display: block;
  color: var(--color-text-muted);
  font-size: 12px;
}

.sync-card strong {
  color: var(--color-heading);
  font-size: 20px;
  font-weight: 800;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 8px;
  background: var(--color-accent);
  color: #06111f;
  font-weight: 800;
}

@media (max-width: 760px) {
  .app-header {
    align-items: flex-start;
    flex-direction: column;
    min-height: auto;
    padding: 20px;
  }

  .header-actions {
    width: 100%;
  }

  .sync-card,
  .primary-action {
    flex: 1;
    justify-content: center;
  }
}
</style>
