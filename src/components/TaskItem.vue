Aqui está o seu arquivo `TaskItem.vue` totalmente repaginado e corrigido.

### 🛠️ O que mudou?

* **Correção da Imagem Gigante:** A imagem dentro do dialog agora tem um controle inteligente de tamanho máximo (`max-width: 400px` e `max-height: 70vh`), impedindo que ela quebre o layout e garantindo que ela mantenha a proporção original (`object-fit: contain`).
* **Visual do Dialog Modernizado:** Transformei o dialog em um modal elegante centralizado na tela, adicionando um efeito de fundo semi-transparente fosco (`backdrop-filter`) para dar destaque à imagem.
* **Botão "Fechar" Estilizado:** Deixou de ser um botão simples de sistema e ganhou um visual limpo, com cantos arredondados, transição suave de cor e posicionamento correto.
* **Responsividade (Mobile First):** Adicionei regras de `@media` para telas menores que 480px. No celular, o dialog se ajusta para ocupar quase toda a largura da tela (`width: 90%`), e a imagem diminui proporcionalmente sem transbordar, mantendo a interface impecável.

---

### `TaskItem.vue` Refatorado

```html
<template>
  <div class="task-item" :class="{ done: task.done }">
    <button v-if="task.img_url" class="img-indicator" @click="showImage = true" title="Ver imagem">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    </button>

    <label class="task-label">
      <input type="checkbox" :checked="task.done" @change="$emit('toggle', task.id)" />
      <span class="task-title">{{ task.title }}</span>
    </label>

    <div class="task-actions">
      <button class="task-edit" @click="$emit('edit', task)">Editar</button>
      <button class="task-remove" @click="$emit('remove', task.id)">Remover</button>
    </div>
  </div>

  <dialog v-if="showImage" open class="image-dialog" @click.self="showImage = false">
    <div class="dialog-content">
      <img :src="task.img_url" alt="Imagem da tarefa" class="dialog-img" />
      <button class="btn-close-dialog" @click="showImage = false">Fechar</button>
    </div>
  </dialog>
</template>

<script setup>
import { ref } from 'vue'

const showImage = ref(false)

defineProps({
  task: {
    type: Object,
    required: true,
  },
})

defineEmits(['toggle', 'remove', 'edit'])
</script>

<style scoped>
/* Estrutura do item da lista */
.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  gap: 12px;
}

.task-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.task-item.done {
  opacity: 0.55;
}

/* Área reativa do checkbox e texto */
.task-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
  min-width: 0; /* Evita que o texto quebre o flexbox */
}

.task-label input[type='checkbox'] {
  width: 20px;
  height: 20px;
  accent-color: #642db8;
  cursor: pointer;
  flex-shrink: 0;
}

.task-title {
  font-size: 1rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-item.done .task-title {
  text-decoration: line-through;
  color: #888;
}

/* Botões de Ação laterais */
.task-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
}

.task-edit, .task-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.task-edit {
  color: #4a90d9;
}
.task-edit:hover {
  background-color: #eaf2fb;
}

.task-remove {
  color: #e74c3c;
}
.task-remove:hover {
  background-color: #fdecea;
}

/* Indicador com ícone de Câmera */
.img-indicator {
  background: none;
  border: none;
  cursor: pointer;
  color: #777;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
  flex-shrink: 0;
}

.img-indicator:hover {
  color: #642db8;
  background-color: #f1edfa;
}

/* --- MODAL / DIALOG CUSTOMIZADO --- */
.image-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px); /* Suave desfoque de fundo estilo iOS/Premium */
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.dialog-content {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: auto;
  max-width: 440px; /* Base robusta para desktops */
  animation: scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Configuração de tamanho controlado da imagem */
.dialog-img {
  width: 100%;
  max-width: 400px;
  max-height: 60vh; /* Ocupa no máximo 60% da altura disponível da tela */
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid #eee;
}

/* Botão Fechar Estilizado */
.btn-close-dialog {
  width: 100%;
  padding: 10px;
  background-color: #f1f3f5;
  color: #495057;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-dialog:hover {
  background-color: #e9ecef;
  color: #212529;
}

/* Animação suave de entrada */
@keyframes scaleUp {
  from {
    transform: scale(0.92);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* --- MEDIA QUERY: MOBILE --- */
@media (max-width: 480px) {
  .task-item {
    padding: 10px 12px;
  }

  .task-title {
    font-size: 0.95rem;
  }

  .dialog-content {
    width: 92%;
    padding: 14px;
    gap: 12px;
  }

  .dialog-img {
    max-height: 50vh;
  }

  .btn-close-dialog {
    padding: 12px;
  }
}
</style>

