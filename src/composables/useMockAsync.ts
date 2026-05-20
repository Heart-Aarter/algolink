import { onUnmounted, ref } from 'vue'

export function useMockAsync(delayMs: number) {
  const isGenerating = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  function start(onComplete?: () => void) {
    if (isGenerating.value) return
    isGenerating.value = true

    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      isGenerating.value = false
      onComplete?.()
    }, delayMs)
  }

  onUnmounted(() => {
    window.clearTimeout(timer)
  })

  return { isGenerating, start }
}
