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
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(127, 164, 216, 0.06), transparent 45%), var(--color-panel);
  box-shadow: var(--shadow-panel);
}

.chart-panel::before {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 38%);
  content: '';
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
