<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

async function handleLogin() {
  loading.value = true;
  errorMessage.value = "";
  try {
    await authStore.login(email.value, password.value);
    router.push("/");
  } catch (err) {
    errorMessage.value =
      err.response?.data?.detail ?? "Erro ao entrar. Verifique suas credenciais.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-container">
    <form class="login-form" @submit.prevent="handleLogin">
      <h1>Entrar</h1>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="seu@email.com"
          required
          autocomplete="email"
        />
      </div>

      <div class="field">
        <label for="password">Senha</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
          autocomplete="current-password"
        />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? "Entrando..." : "Entrar" }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 50vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.login-form {
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);

  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h1 {
  color: #642db8;
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #444;
}

.field input {
  width: 100%;
  height: 52px;
  padding: 0 1rem;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: #fff;
}

.field input:focus {
  outline: none;
  border-color: #642db8;
  box-shadow: 0 0 0 4px rgba(100, 45, 184, 0.12);
}

button {
  height: 54px;
  border: none;
  border-radius: 12px;
  background: #642db8;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  background: #5725a3;
  transform: translateY(-1px);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  padding: 12px 16px;
  background: #fff0f0;
  border: 1px solid #ffcaca;
  color: #d93025;
  border-radius: 12px;
  font-size: 0.9rem;
}

@media (max-width: 480px) {
  .login-form {
    padding: 2rem 1.5rem;
    border-radius: 20px;
  }

  h1 {
    font-size: 1.75rem;
  }
}
</style>
