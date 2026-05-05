<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { NButton, NInput, NTag } from 'naive-ui'
import { useAlgoLinkStore } from '@/stores/algolink'

const store = useAlgoLinkStore()
const username = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const visible = ref(false)
const inputRef = ref<InstanceType<typeof NInput> | null>(null)

function open() {
  visible.value = true
  errorMessage.value = ''
  username.value = ''
  password.value = ''
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function close() {
  visible.value = false
}

async function submit() {
  const trimmed = username.value.trim()
  const rawPassword = password.value

  if (!trimmed) {
    errorMessage.value = '请输入用户名'
    return
  }

  if (trimmed.length > 32) {
    errorMessage.value = '用户名最多 32 个字符'
    return
  }

  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    errorMessage.value = '用户名只允许字母、数字、下划线和连字符'
    return
  }

  if (rawPassword.length < 6 || rawPassword.length > 64) {
    errorMessage.value = '密码长度必须为 6-64 位'
    return
  }

  submitting.value = true
  errorMessage.value = ''

  try {
    const result = await store.loginSimpleUser(trimmed, rawPassword)

    if (!result.ok) {
      errorMessage.value = result.message
      return
    }

    close()
  } catch {
    errorMessage.value = '登录失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

watch(
  () => store.currentUserId,
  (next) => {
    if (!next) {
      open()
    }
  },
)

defineExpose({ open, close })

onMounted(() => {
  if (!store.currentUserId) {
    open()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="auth-overlay">
      <div v-if="visible" class="auth-backdrop" @click.self="close">
        <div class="auth-panel" role="dialog" aria-label="用户登录">
          <div class="auth-top-accent" aria-hidden="true">
            <i class="accent-red" />
            <i class="accent-gold" />
            <i class="accent-teal" />
          </div>

          <div class="auth-body">
            <div class="auth-brand">
              <span class="auth-brand-mark">AL</span>
              <div>
                <strong>AlgoLink</strong>
                <small>AI 多 OJ 数据分析</small>
              </div>
            </div>

            <div class="auth-heading">
              <p class="eyebrow">IDENTITY / 用户名</p>
              <h2>进入控制台</h2>
              <p>
                输入公开用户名即可开始。新用户名将自动注册，已注册用户将加载服务端数据。
              </p>
            </div>

            <form class="auth-form" @submit.prevent="submit">
              <div class="auth-input-wrap">
                <span class="auth-input-prefix">@</span>
                <n-input
                  ref="inputRef"
                  v-model:value="username"
                  size="large"
                  placeholder="username"
                  :disabled="submitting"
                  :status="errorMessage ? 'error' : undefined"
                  @keydown.enter="submit"
                />
              </div>

              <div class="auth-input-wrap">
                <span class="auth-input-prefix">#</span>
                <n-input
                  v-model:value="password"
                  type="password"
                  show-password-on="click"
                  size="large"
                  placeholder="password"
                  :disabled="submitting"
                  :status="errorMessage ? 'error' : undefined"
                  @keydown.enter="submit"
                />
              </div>

              <n-button
                type="primary"
                size="large"
                attr-type="submit"
                :loading="submitting"
                block
                strong
              >
                {{ submitting ? '正在连接...' : '进入 AlgoLink' }}
              </n-button>

              <Transition name="auth-error">
                <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
              </Transition>
            </form>
          </div>

          <div class="auth-footer" aria-hidden="true">
            <span>SYNCING FROM PUBLIC OJ DATA</span>
            <n-tag type="info" size="tiny" round>仅公开 handle</n-tag>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.auth-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  align-items: center;
  justify-items: center;
  background: rgba(0, 0, 0, 0.64);
  backdrop-filter: blur(10px) saturate(110%);
}

.auth-panel {
  position: relative;
  z-index: 1;
  width: min(92vw, 440px);
  overflow: hidden;
  border: 1px solid rgba(194, 138, 46, 0.28);
  border-radius: 12px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), transparent 48%),
    linear-gradient(90deg, rgba(142, 39, 36, 0.1), transparent 4px),
    var(--color-panel);
  box-shadow:
    0 32px 80px rgba(0, 0, 0, 0.48),
    0 0 0 1px rgba(194, 138, 46, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.auth-top-accent {
  display: flex;
  height: 3px;
}

.auth-top-accent i {
  height: 100%;
}

.accent-red {
  flex: 1;
  background: var(--stripe-red);
}

.accent-gold {
  flex: 1;
  background: var(--stripe-gold);
}

.accent-teal {
  flex: 1;
  background: var(--stripe-teal);
}

.auth-body {
  padding: 40px 36px 32px;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.auth-brand-mark {
  display: inline-grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  background:
    linear-gradient(135deg, var(--glass-highlight), transparent 46%), rgba(255, 255, 255, 0.035);
  color: var(--color-heading);
  font-size: 14px;
  font-weight: 850;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.auth-brand strong {
  display: block;
  color: var(--color-heading);
  font-size: 19px;
  font-weight: 850;
}

.auth-brand small {
  color: var(--color-text-muted);
  font-size: 12px;
}

.auth-heading {
  margin-bottom: 24px;
}

.auth-heading h2 {
  margin: 8px 0 10px;
  color: var(--color-heading);
  font-size: 22px;
  font-weight: 840;
}

.auth-heading p {
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.6;
}

.auth-form {
  display: grid;
  gap: 14px;
}

.auth-input-wrap {
  position: relative;
}

.auth-input-prefix {
  position: absolute;
  top: 50%;
  left: 14px;
  z-index: 2;
  color: var(--color-text-muted);
  font-size: 15px;
  font-weight: 700;
  transform: translateY(-50%);
  pointer-events: none;
}

.auth-input-wrap :deep(.n-input .n-input__input-el) {
  padding-left: 32px;
}

.auth-error {
  color: var(--color-danger);
  font-size: 13px;
  font-weight: 680;
  line-height: 1.4;
}

.auth-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 36px 14px;
  border-top: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.015);
}

.auth-footer span {
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.auth-overlay-enter-active,
.auth-overlay-leave-active {
  transition: opacity 0.28s ease;
}

.auth-overlay-enter-active .auth-panel,
.auth-overlay-leave-active .auth-panel {
  transition:
    opacity 0.28s ease,
    transform 0.28s cubic-bezier(0.2, 0.72, 0.18, 1);
}

.auth-overlay-enter-from,
.auth-overlay-leave-to {
  opacity: 0;
}

.auth-overlay-enter-from .auth-panel,
.auth-overlay-leave-to .auth-panel {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.auth-error-enter-active,
.auth-error-leave-active {
  transition: opacity 0.18s ease;
}

.auth-error-enter-from,
.auth-error-leave-to {
  opacity: 0;
}
</style>
