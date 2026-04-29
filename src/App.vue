<script setup lang="ts">
import { darkTheme, type GlobalThemeOverrides } from 'naive-ui'
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useTheme } from '@/composables/useTheme'

const { theme } = useTheme()
const naiveTheme = computed(() => (theme.value === 'dark' ? darkTheme : null))
const naiveThemeOverrides = computed<GlobalThemeOverrides>(() => {
  const isLight = theme.value === 'light'

  return {
    common: {
      primaryColor: isLight ? '#168f86' : '#66d6cb',
      primaryColorHover: isLight ? '#1da79d' : '#7ee4db',
      primaryColorPressed: isLight ? '#117970' : '#40bfb4',
      primaryColorSuppl: isLight ? '#168f86' : '#66d6cb',
      borderRadius: '8px',
      fontFamily:
        'Inter, "Microsoft YaHei", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
  }
})
</script>

<template>
  <n-config-provider :theme="naiveTheme" :theme-overrides="naiveThemeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <div class="app-shell">
          <AppSidebar />
          <div class="app-main">
            <AppHeader />
            <main class="app-content">
              <RouterView v-slot="{ Component, route }">
                <Transition name="page-slide" mode="out-in">
                  <component :is="Component" :key="route.fullPath" />
                </Transition>
              </RouterView>
            </main>
          </div>
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
