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
      primaryColor: isLight ? '#8cab9f' : '#c28a2e',
      primaryColorHover: isLight ? '#6e9286' : '#d6a04a',
      primaryColorPressed: isLight ? '#5b7f73' : '#a66c22',
      primaryColorSuppl: isLight ? '#8cab9f' : '#c28a2e',
      infoColor: isLight ? '#6e9286' : '#8cab9f',
      successColor: isLight ? '#6e9286' : '#8cab9f',
      warningColor: isLight ? '#9b651c' : '#c28a2e',
      errorColor: isLight ? '#8e2724' : '#b94337',
      bodyColor: isLight ? '#eef3f8' : '#070a10',
      cardColor: isLight ? '#ffffff' : '#101822',
      modalColor: isLight ? '#ffffff' : '#101822',
      popoverColor: isLight ? '#ffffff' : '#111a25',
      tableColor: isLight ? '#ffffff' : '#101822',
      tableHeaderColor: isLight ? '#edf3f8' : '#0d141e',
      tableColorHover: isLight ? '#f5f9fc' : '#131f2c',
      inputColor: isLight ? '#ffffff' : '#0b111a',
      tagColor: isLight ? '#f2f6fa' : '#121d29',
      hoverColor: isLight ? 'rgba(142, 39, 36, 0.07)' : 'rgba(194, 138, 46, 0.09)',
      pressedColor: isLight ? 'rgba(142, 39, 36, 0.12)' : 'rgba(194, 138, 46, 0.13)',
      borderColor: isLight ? 'rgba(39, 58, 82, 0.16)' : 'rgba(155, 177, 205, 0.13)',
      dividerColor: isLight ? 'rgba(39, 58, 82, 0.12)' : 'rgba(155, 177, 205, 0.1)',
      textColor1: isLight ? '#142033' : '#f0f7ff',
      textColor2: isLight ? '#34445d' : '#c6d4e5',
      textColor3: isLight ? '#687890' : '#7f8da4',
      placeholderColor: isLight ? '#8a98aa' : '#65748a',
      borderRadius: '8px',
      borderRadiusSmall: '6px',
      boxShadow1: isLight
        ? '0 14px 34px rgba(38, 59, 86, 0.1)'
        : '0 18px 48px rgba(0, 0, 0, 0.24)',
      boxShadow2: isLight
        ? '0 18px 46px rgba(38, 59, 86, 0.12)'
        : '0 22px 60px rgba(0, 0, 0, 0.28)',
      boxShadow3: isLight
        ? '0 22px 62px rgba(38, 59, 86, 0.14)'
        : '0 28px 80px rgba(0, 0, 0, 0.34)',
      fontFamily:
        'Inter, "Microsoft YaHei", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontFamilyMono:
        '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
      fontWeightStrong: '800',
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
