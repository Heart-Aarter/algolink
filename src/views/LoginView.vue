<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NInput, NTag } from 'naive-ui'
import { useAlgoLinkStore } from '@/stores/algolink'

const route = useRoute()
const router = useRouter()
const store = useAlgoLinkStore()

const username = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const inputRef = ref<InstanceType<typeof NInput> | null>(null)

const redirectPath = computed(() => {
  const redirect = route.query.redirect

  if (typeof redirect !== 'string' || !redirect.startsWith('/') || redirect === '/login') {
    return '/'
  }

  return redirect
})

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

    await router.replace(redirectPath.value)
  } catch {
    errorMessage.value = '登录失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus()
  })
})
</script>

<template>
  <main class="login-page">
    <div class="login-starfield" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>

    <section class="login-panel" aria-label="用户登录">
      <div class="auth-top-accent" aria-hidden="true">
        <i class="accent-red" />
        <i class="accent-gold" />
        <i class="accent-teal" />
      </div>

      <div class="login-copy">
        <div class="auth-brand">
          <span class="auth-brand-mark">AL</span>
          <div>
            <strong>AlgoLink</strong>
            <small>AI 多 OJ 数据分析</small>
          </div>
        </div>

        <p class="eyebrow">IDENTITY / 用户名</p>
        <h1>进入 AlgoLink 控制台</h1>
        <p>
          输入公开用户名即可开始。新用户名会自动注册，已注册用户会加载服务端保存的账号、
          提交记录、训练计划和每日一题数据。
        </p>

        <div class="login-metrics" aria-hidden="true">
          <span>Codeforces</span>
          <span>洛谷</span>
          <span>AtCoder</span>
        </div>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <div class="auth-input-wrap">
          <n-input
            ref="inputRef"
            v-model:value="username"
            size="large"
            placeholder="username"
            :disabled="submitting"
            :status="errorMessage ? 'error' : undefined"
            @keydown.enter="submit"
          >
            <template #prefix>@</template>
          </n-input>
        </div>

        <div class="auth-input-wrap">
          <n-input
            v-model:value="password"
            type="password"
            show-password-on="click"
            size="large"
            placeholder="password"
            :disabled="submitting"
            :status="errorMessage ? 'error' : undefined"
            @keydown.enter="submit"
          >
            <template #prefix>#</template>
          </n-input>
        </div>

        <n-button type="primary" size="large" attr-type="submit" :loading="submitting" block strong>
          {{ submitting ? '正在连接...' : '进入 AlgoLink' }}
        </n-button>

        <Transition name="auth-error">
          <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
        </Transition>

        <div class="auth-footer" aria-hidden="true">
          <span>SYNCING FROM PUBLIC OJ DATA</span>
          <n-tag type="info" size="tiny" round>仅公开 handle</n-tag>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  position: relative;
  display: grid;
  min-height: 100vh;
  place-items: center;
  overflow: hidden;
  padding: 32px;
  background:
    radial-gradient(circle at 18% 18%, rgba(142, 39, 36, 0.16), transparent 28%),
    radial-gradient(circle at 78% 24%, rgba(140, 171, 159, 0.2), transparent 26%),
    linear-gradient(135deg, rgba(194, 138, 46, 0.08), transparent 34%),
    var(--color-background);
}

.login-page::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(140, 171, 159, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(194, 138, 46, 0.07) 1px, transparent 1px);
  background-size: 42px 42px;
  content: '';
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.78), transparent 82%);
  pointer-events: none;
}

.login-starfield {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login-starfield span {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 999px;
  background: var(--color-accent);
  box-shadow: 0 0 20px var(--color-accent);
  opacity: 0.72;
}

.login-starfield span:nth-child(1) {
  top: 16%;
  left: 21%;
}

.login-starfield span:nth-child(2) {
  top: 24%;
  right: 18%;
}

.login-starfield span:nth-child(3) {
  right: 27%;
  bottom: 19%;
}

.login-starfield span:nth-child(4) {
  bottom: 28%;
  left: 12%;
}

.login-starfield span:nth-child(5) {
  top: 52%;
  right: 11%;
}

.login-panel {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 420px);
  width: min(100%, 960px);
  overflow: hidden;
  border: 1px solid rgba(194, 138, 46, 0.28);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), transparent 48%),
    linear-gradient(90deg, rgba(142, 39, 36, 0.1), transparent 4px),
    var(--color-panel);
  box-shadow:
    0 32px 80px rgba(0, 0, 0, 0.34),
    0 0 0 1px rgba(194, 138, 46, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.auth-top-accent {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
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

.login-copy {
  padding: 58px 54px 52px;
  border-right: 1px solid var(--color-border);
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 48px;
}

.auth-brand-mark {
  display: inline-grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: 10px;
  background:
    linear-gradient(135deg, var(--glass-highlight), transparent 46%), rgba(255, 255, 255, 0.035);
  color: var(--color-heading);
  font-size: 15px;
  font-weight: 850;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.auth-brand strong {
  display: block;
  color: var(--color-heading);
  font-size: 20px;
  font-weight: 850;
}

.auth-brand small {
  color: var(--color-text-muted);
  font-size: 12px;
}

.login-copy h1 {
  max-width: 430px;
  margin: 10px 0 16px;
  color: var(--color-heading);
  font-size: 34px;
  font-weight: 860;
  line-height: 1.12;
}

.login-copy p {
  max-width: 500px;
  color: var(--color-text-muted);
  font-size: 15px;
  line-height: 1.75;
}

.login-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 44px;
}

.login-metrics span {
  padding: 7px 10px;
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.055), transparent 42%), rgba(255, 255, 255, 0.025);
  color: var(--color-text-soft);
  font-size: 12px;
  font-weight: 760;
}

.auth-form {
  display: grid;
  align-content: center;
  gap: 14px;
  padding: 58px 44px 42px;
}

.auth-input-wrap {
  position: relative;
}

.auth-input-wrap :deep(.n-input__prefix) {
  color: var(--color-text-muted);
  font-size: 15px;
  font-weight: 700;
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
  gap: 12px;
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.auth-footer span {
  min-width: 0;
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.35;
}

.auth-error-enter-active,
.auth-error-leave-active {
  transition: opacity 0.18s ease;
}

.auth-error-enter-from,
.auth-error-leave-to {
  opacity: 0;
}

@media (max-width: 820px) {
  .login-page {
    align-items: start;
    padding: 20px;
  }

  .login-panel {
    grid-template-columns: 1fr;
  }

  .login-copy {
    padding: 38px 28px 24px;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .auth-brand {
    margin-bottom: 28px;
  }

  .login-copy h1 {
    font-size: 28px;
  }

  .login-metrics {
    margin-top: 24px;
  }

  .auth-form {
    padding: 28px;
  }
}
</style>
