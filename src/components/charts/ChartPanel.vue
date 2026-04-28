<script setup lang="ts">
import * as echarts from 'echarts'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

const props = defineProps<{
  title: string
  option: echarts.EChartsOption
}>()

const chartEl = ref<HTMLDivElement | null>(null)
const chart = shallowRef<echarts.ECharts | null>(null)

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
    <div ref="chartEl" class="chart-canvas" />
  </section>
</template>

<style scoped>
.chart-panel {
  min-height: 320px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
}

.chart-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

h2 {
  color: var(--color-heading);
  font-size: 17px;
  font-weight: 850;
}

.chart-canvas {
  width: 100%;
  height: 250px;
}
</style>
