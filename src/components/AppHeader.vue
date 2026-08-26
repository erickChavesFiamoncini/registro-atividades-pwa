<template>
  <header class="app-header">
    <h1>Meus gestor de Tarefas!!!!</h1>
    <nav>
      <router-link to="/">Início</router-link>
      <router-link to="/about">Sobre</router-link>

      <!-- Elemento de referência para o clique fora (ref="userMenuRef") -->
      <div v-if="authStore.isAuthenticated" ref="userMenuRef" class="user-menu">
        <button
          class="user-avatar-btn"
          @click="toggleDropdown"
          :title="authStore.userEmail"
        >
          👤
        </button>

        <div v-if="isDropdownOpen" class="dropdown-menu">
          <div class="user-info">
            <span class="user-email-label">{{ authStore.userEmail }}</span>
          </div>

          <hr class="dropdown-divider" />

          <button class="logout-btn" @click="handleLogout">
            🚪 Sair
          </button>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isDropdownOpen = ref(false)
const userMenuRef = ref(null) // Referência para o container do menu

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function handleLogout() {
  isDropdownOpen.value = false
  authStore.logout()
  router.push('/login')
}

// Função para detectar o clique fora
function handleClickOutside(event) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

// Registra o evento quando o componente é montado
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

// Remove o evento quando o componente é destruído (evita vazamento de memória)
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 3px solid #642db8;
  margin-bottom: 24px;
}

.app-header h1 {
  font-size: 1.4rem;
  color: #642db8;
}

nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

nav a {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  font-size: 0.9rem;
}

nav a.router-link-active {
  color: #642db8;
}

/* Dropdown e Avatar */
.user-menu {
  position: relative;
}

.user-avatar-btn {
  background: #f1edfa;
  color: #642db8;
  border: 1px solid #d8b4fe;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.user-avatar-btn:hover {
  background: #e5d9f8;
  transform: scale(1.05);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  padding: 8px;
  min-width: 180px;
  z-index: 100;
}

.user-info {
  padding: 6px 8px;
}

.user-email-label {
  display: block;
  font-size: 0.8rem;
  color: #4a5568;
  font-weight: 600;
  word-break: break-all;
}

.dropdown-divider {
  border: none;
  border-top: 1px solid #edf2f7;
  margin: 6px 0;
}

.logout-btn {
  width: 100%;
  text-align: left;
  padding: 8px;
  background: none;
  border: none;
  color: #e74c3c;
  font-weight: 600;
  font-size: 0.85rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #fdecea;
}
</style>
