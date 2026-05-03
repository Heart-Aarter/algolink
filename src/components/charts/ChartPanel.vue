<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useSlots, watch } from 'vue'

const props = defineProps<{
  title: string
  option: echarts.EChartsOption
}>()

const chartEl = ref<HTMLDivElement | null>(null)
const chart = shallowRef<echarts.ECharts | null>(null)
const slots = useSlots()
const hasSideContent = computed(() => !!slots.default)

function renderChart() {
  if (!chartEl.value) {
    return
  }

  chart.value ??= echarts.init(chartEl.value)
  chart.value.setOption(props.option, true)
}

function resizeChart() {
  chart.value?.resize()
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', resizeChart)
})

watch(() => props.option, renderChart, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart.value?.dispose()
})
</script>

<template>
  <section class="chart-panel">
    <div class="chart-heading">
      <h2>{{ title }}</h2>
    </div>
    <div class="chart-body" :class="{ 'has-side-content': hasSideContent }">
      <div ref="chartEl" class="chart-canvas" />
      <slot />
    </div>
  </section>
</template>

<style scoped>
.chart-panel {
  position: relative;
  min-height: 326px;
  padding: 22px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(142, 39, 36, 0.1), transparent 4px),
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 48%), var(--color-panel);
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(8px);
}

.chart-panel::before {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image:
    linear-gradient(rgba(155, 177, 205, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(155, 177, 205, 0.035) 1px, transparent 1px);
  background-size: 28px 28px;
  content: '';
  opacity: 0.52;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.42), transparent 82%);
  pointer-events: none;
}

.chart-panel::after {
  position: absolute;
  top: 0;
  right: 18px;
  left: 18px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--stripe-red), var(--stripe-gold), var(--stripe-teal), transparent);
  content: '';
  opacity: 0.66;
  pointer-events: none;
}

.chart-heading {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

h2 {
  color: var(--color-heading);
  font-size: 17px;
  font-weight: 830;
}

.chart-canvas {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 246px;
}

.chart-body.has-side-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
}

.chart-body.has-side-content .chart-canvas {
  min-width: 0;
}

@media (max-width: 680px) {
  .chart-body.has-side-content {
    grid-template-columns: 1fr;
  }
}
</style>
