<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  helper: string
}>()
</script>

<template>
  <article class="stat-card">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
    <p>{{ helper }}</p>
  </article>
</template>

<style scoped>
.stat-card {
  min-height: 126px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
}

span {
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 700;
}

strong {
  display: block;
  margin-top: 10px;
  color: var(--color-heading);
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
}

p {
  margin-top: 12px;
  color: var(--color-text-soft);
  font-size: 13px;
}
</style>
