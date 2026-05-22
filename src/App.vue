<script setup lang="ts">
import { darkTheme, type GlobalThemeOverrides } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import MobileCommandMenu from '@/components/layout/MobileCommandMenu.vue'
import { useTheme } from '@/composables/useTheme'

const { theme } = useTheme()
const route = useRoute()
const sidebarCollapsed = ref(false)
const showIntro = ref(true)
const naiveTheme = computed(() => (theme.value === 'dark' ? darkTheme : null))
const isFullPageRoute = computed(() => route.meta.fullPage === true)
const shellClass = computed(() => ({
  'sidebar-collapsed': sidebarCollapsed.value,
  'intro-visible': showIntro.value,
}))
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

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('algolink.sidebarCollapsed', sidebarCollapsed.value ? '1' : '0')
}

function closeIntro() {
  showIntro.value = false
  localStorage.setItem('algolink.introClosed', '1')
}

onMounted(() => {
  sidebarCollapsed.value = localStorage.getItem('algolink.sidebarCollapsed') === '1'
  showIntro.value = localStorage.getItem('algolink.introClosed') !== '1'
})
</script>

<template>
  <n-config-provider :theme="naiveTheme" :theme-overrides="naiveThemeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <Transition name="intro-shell">
          <section
            v-if="showIntro && !isFullPageRoute"
            class="intro-screen"
            aria-label="AlgoLink intro"
          >
            <div class="intro-starfield" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div class="intro-scanline" aria-hidden="true" />
            <div class="intro-light-ribbons" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div class="intro-launchscape">
              <div class="intro-system-label" aria-hidden="true">
                <span>ALGO LINK</span>
                <b>ORBITAL TRAINING OS</b>
              </div>

              <div class="intro-logo-stage">
                <div class="intro-orbit-ring intro-orbit-ring-a" aria-hidden="true" />
                <div class="intro-orbit-ring intro-orbit-ring-b" aria-hidden="true" />
                <div class="intro-orbit-ring intro-orbit-ring-c" aria-hidden="true" />
                <div class="intro-logo-frame" aria-label="AlgoLink">
                  <div class="intro-logo-glyph">
                    <span class="glyph-a">A</span>
                    <span class="glyph-l">L</span>
                    <i class="glyph-orbit" />
                    <i class="glyph-dot glyph-dot-top" />
                    <i class="glyph-dot glyph-dot-right" />
                    <i class="glyph-dot glyph-dot-bottom" />
                    <i class="glyph-link" />
                    <i class="glyph-hub" />
                  </div>
                </div>
                <strong class="intro-wordmark">Algo<span>Link</span></strong>
                <div class="intro-launch-core" aria-hidden="true" />
                <div class="intro-launch-flare" aria-hidden="true" />
                <div class="intro-data-rail" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div class="intro-gantry intro-console-rails" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div class="intro-rail intro-rail-left" aria-hidden="true" />
              <div class="intro-rail intro-rail-right" aria-hidden="true" />
              <div class="intro-groundline" aria-hidden="true" />

              <div class="intro-mission">
                <span>BREAKTHROUGH / 多 OJ 数据聚合</span>
                <h2>算法训练进入深空轨道</h2>
                <p>公开 handle 聚合、提交轨迹回放、能力画像与 AI 训练策略，在一个控制台内完成。</p>
                <div class="intro-meter" aria-hidden="true">
                  <i />
                </div>
                <button class="intro-enter" type="button" @click="closeIntro">进入控制台</button>
              </div>
            </div>
          </section>
        </Transition>

        <RouterView v-if="isFullPageRoute" v-slot="{ Component, route }">
          <Transition name="page-slide" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </RouterView>

        <div v-else class="app-shell" :class="shellClass">
          <AppSidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
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
          <MobileCommandMenu />
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
