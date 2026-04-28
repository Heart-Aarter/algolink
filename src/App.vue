<script setup lang="ts">
import { darkTheme, type GlobalThemeOverrides } from 'naive-ui'
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'

const naiveThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#66d6cb',
    primaryColorHover: '#7ee4db',
    primaryColorPressed: '#40bfb4',
    primaryColorSuppl: '#66d6cb',
    borderRadius: '8px',
    fontFamily:
      'Inter, "Microsoft YaHei", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
}
</script>

<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="naiveThemeOverrides">
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
