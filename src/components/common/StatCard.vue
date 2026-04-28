<script setup lang="ts">
import { NCard } from 'naive-ui'

defineProps<{
  label: string
  value: string | number
  helper: string
}>()
</script>

<template>
  <n-card class="stat-card" :bordered="false" content-style="padding: 0;">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
    <p>{{ helper }}</p>
  </n-card>
</template>

<style scoped>
.stat-card {
  position: relative;
  min-height: 118px;
  padding: 20px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(102, 214, 203, 0.055), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.026), transparent), var(--color-panel);
  box-shadow: var(--shadow-panel);
}

.stat-card::before {
  position: absolute;
  top: 0;
  right: 18px;
  left: 18px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  content: '';
  opacity: 0.55;
}

span {
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 760;
}

strong {
  display: block;
  margin-top: 12px;
  color: var(--color-heading);
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
}

p {
  margin-top: 12px;
  color: var(--color-text-soft);
  font-size: 13px;
  line-height: 1.55;
}
</style>
