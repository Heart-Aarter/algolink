<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { NIcon } from 'naive-ui'
import {
  Analytics,
  Bulb,
  Calendar,
  Close,
  DocumentText,
  Grid,
  Home,
  List,
  Menu,
  Person,
  Rocket,
  Settings,
  Today,
  Trophy,
} from '@vicons/ionicons5'

const route = useRoute()
const open = ref(false)

const primaryItems = [
  { path: '/', label: 'Dashboard', icon: Home, names: ['dashboard'] },
  { path: '/submissions', label: '提交', icon: List, names: ['submissions'] },
  { path: '/ai-advice', label: 'Coach', icon: Bulb, names: ['ai-advice'] },
  { path: '/training-plan', label: '计划', icon: Calendar, names: ['training-plan'] },
  {
    path: '/profile',
    label: '更多',
    icon: Grid,
    names: [
      'profile',
      'accounts',
      'ability-profile',
      'training-report',
      'daily',
      'leaderboard',
      'settings',
      'about',
    ],
  },
]

const secondaryItems = [
  { path: '/accounts', label: '账号', icon: Person, names: ['accounts'] },
  { path: '/profile', label: '个人', icon: Person, names: ['profile'] },
  { path: '/ability-profile', label: '画像', icon: Analytics, names: ['ability-profile'] },
  { path: '/training-report', label: '报告', icon: DocumentText, names: ['training-report'] },
  { path: '/daily', label: '每日', icon: Today, names: ['daily'] },
  { path: '/leaderboard', label: '排行', icon: Trophy, names: ['leaderboard'] },
  { path: '/settings', label: '设置', icon: Settings, names: ['settings'] },
  { path: '/about', label: '关于', icon: Rocket, names: ['about'] },
]

const activeName = computed(() => String(route.name ?? ''))

function isActive(names: string[]) {
  return names.includes(activeName.value)
}

function closeMenu() {
  open.value = false
}

function toggleMenu() {
  open.value = !open.value
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

watch(() => route.fullPath, closeMenu)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="mobile-command-menu" :class="{ open }">
    <Transition name="mobile-command-backdrop">
      <button
        v-if="open"
        class="mobile-command-backdrop"
        type="button"
        aria-label="关闭手机端菜单"
        @click="closeMenu"
      />
    </Transition>

    <Transition name="mobile-command-sheet">
      <nav v-if="open" class="mobile-command-sheet" aria-label="手机端命令菜单">
        <div class="mobile-command-head">
          <div>
            <p>ALGO COMMAND</p>
            <strong>跳转到</strong>
          </div>
          <button type="button" aria-label="关闭菜单" @click="closeMenu">
            <n-icon :component="Close" />
          </button>
        </div>

        <div class="mobile-command-primary">
          <RouterLink
            v-for="item in primaryItems"
            :key="item.path"
            class="mobile-command-item"
            :class="{ active: isActive(item.names) }"
            :to="item.path"
          >
            <n-icon :component="item.icon" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>

        <div class="mobile-command-secondary">
          <RouterLink
            v-for="item in secondaryItems"
            :key="item.path"
            class="mobile-command-shortcut"
            :class="{ active: isActive(item.names) }"
            :to="item.path"
          >
            <n-icon :component="item.icon" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>
    </Transition>

    <button
      class="mobile-command-fab"
      type="button"
      :aria-expanded="open"
      aria-label="打开手机端菜单"
      @click="toggleMenu"
    >
      <n-icon :component="open ? Close : Menu" />
      <span>{{ open ? '关闭' : '菜单' }}</span>
    </button>
  </div>
</template>

<style scoped>
.mobile-command-menu {
  display: none;
}

@media (max-width: 760px) {
  .mobile-command-menu {
    display: block;
  }

  .mobile-command-backdrop {
    position: fixed;
    inset: 0;
    z-index: 70;
    border: 0;
    background:
      linear-gradient(180deg, transparent 0 48%, rgba(0, 0, 0, 0.5)),
      rgba(4, 6, 8, 0.2);
    backdrop-filter: blur(2px);
  }

  .mobile-command-sheet {
    position: fixed;
    right: 14px;
    bottom: calc(82px + env(safe-area-inset-bottom));
    left: 14px;
    z-index: 80;
    display: grid;
    gap: 12px;
    padding: 14px;
    border: 1px solid rgba(194, 138, 46, 0.34);
    border-radius: 18px;
    background:
      linear-gradient(90deg, rgba(142, 39, 36, 0.14), transparent 5px),
      linear-gradient(180deg, var(--glass-highlight), transparent 62%),
      var(--color-panel);
    box-shadow:
      var(--shadow-elevated),
      inset 0 1px 0 var(--glass-highlight);
    backdrop-filter: blur(20px) saturate(145%);
  }

  .mobile-command-sheet::before {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-image:
      linear-gradient(rgba(194, 138, 46, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(140, 171, 159, 0.06) 1px, transparent 1px);
    background-size: 18px 18px;
    content: '';
    opacity: 0.42;
    pointer-events: none;
  }

  .mobile-command-sheet > * {
    position: relative;
    z-index: 1;
  }

  .mobile-command-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .mobile-command-head p {
    color: var(--color-text-muted);
    font-size: 10px;
    font-weight: 860;
    letter-spacing: 0;
  }

  .mobile-command-head strong {
    display: block;
    margin-top: 2px;
    color: var(--color-heading);
    font-size: 17px;
    font-weight: 880;
  }

  .mobile-command-head button,
  .mobile-command-fab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(194, 138, 46, 0.34);
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.16), transparent 44%),
      rgba(255, 255, 255, 0.055);
    color: var(--color-heading);
  }

  .mobile-command-head button {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    font-size: 18px;
  }

  .mobile-command-primary {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
  }

  .mobile-command-item,
  .mobile-command-shortcut {
    min-width: 0;
    border: 1px solid rgba(154, 170, 190, 0.13);
    background: rgba(255, 255, 255, 0.045);
    color: var(--color-text-soft);
  }

  .mobile-command-item {
    display: grid;
    justify-items: center;
    gap: 5px;
    min-height: 64px;
    padding: 8px 4px;
    border-radius: 14px;
    font-size: 11px;
    font-weight: 830;
  }

  .mobile-command-item .n-icon {
    font-size: 21px;
  }

  .mobile-command-secondary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .mobile-command-shortcut {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-height: 38px;
    padding: 0 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 760;
  }

  .mobile-command-shortcut .n-icon {
    font-size: 15px;
  }

  .mobile-command-item.active,
  .mobile-command-shortcut.active {
    border-color: rgba(194, 138, 46, 0.5);
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.16), transparent 46%),
      rgba(194, 138, 46, 0.16);
    color: var(--color-heading);
  }

  .mobile-command-item.active .n-icon,
  .mobile-command-shortcut.active .n-icon {
    color: var(--color-gold);
  }

  .mobile-command-fab {
    position: fixed;
    right: 18px;
    bottom: calc(18px + env(safe-area-inset-bottom));
    z-index: 90;
    gap: 6px;
    min-width: 76px;
    height: 52px;
    padding: 0 15px;
    border-color: rgba(194, 138, 46, 0.58);
    border-radius: 999px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.25), transparent 44%),
      var(--color-gold);
    color: #071015;
    font-size: 13px;
    font-weight: 900;
    box-shadow:
      0 18px 42px rgba(0, 0, 0, 0.34),
      0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .mobile-command-fab .n-icon {
    font-size: 20px;
  }

  .mobile-command-sheet-enter-active,
  .mobile-command-sheet-leave-active,
  .mobile-command-backdrop-enter-active,
  .mobile-command-backdrop-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;
  }

  .mobile-command-sheet-enter-from,
  .mobile-command-sheet-leave-to {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }

  .mobile-command-backdrop-enter-from,
  .mobile-command-backdrop-leave-to {
    opacity: 0;
  }
}
</style>
