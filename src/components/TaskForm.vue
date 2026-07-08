<template>
  <form class="task-form" @submit.prevent="handleSubmit">
    <div class="task-row">
      <input
        v-model="newTask"
        type="text"
        placeholder="Nova tarefa..."
        class="task-input"
      />
      <button type="submit" class="task-button" :disabled="uploading">
        {{ editingTask ? 'Alterar' : 'Adicionar' }}
      </button>
      <button v-if="editingTask" type="button" class="task-button-cancel" @click="handleCancel">
        Cancelar
      </button>
    </div>

    <div class="image-section">
      <img
        v-if="previewUrl || editingTask?.img_url"
        :src="previewUrl || editingTask?.img_url"
        class="image-preview"
        alt="Imagem da tarefa"
      />

      <label class="image-label" :class="{ disabled: uploading }">
        <span v-if="uploading" class="upload-status">Enviando...</span>
        <span v-else>
          {{
            previewUrl || editingTask?.img_url
              ? '📷 Trocar imagem'
              : isMobileDevice
                ? '📷 Fotografar'
                : '📁 Adicionar imagem'
          }}
        </span>

        <input
          type="file"
          accept="image/jpeg,image/png"
          :capture="isMobileDevice ? 'environment' : undefined"
          class="image-input"
          :disabled="uploading"
          @change="handleImageChange"
        />
      </label>

      <button
        v-if="isMobileDevice"
        type="button"
        class="task-button-secondary"
        @click="showCameraCapture = !showCameraCapture"
      >
        {{ showCameraCapture ? 'Fechar câmera' : 'Abrir preview ao vivo' }}
      </button>

      <CameraCapture v-if="isMobileDevice && showCameraCapture" @captured="handleCameraCapture" />

      <p class="image-help">
        {{ isMobileDevice ? 'O botão acima abrirá a câmera do seu celular.' : 'Seletor de arquivos habilitado para Computador.' }}
      </p>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import tasksApi from '../api/tasksApi.js'
import CameraCapture from './CameraCapture.vue'

const props = defineProps({
  editingTask: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['add', 'update', 'cancel'])

// Estado Reativo
const newTask = ref('')
const previewUrl = ref(null)
const imgAttachmentKey = ref(null)
const uploading = ref(false)
const showCameraCapture = ref(false)
const isMobileDevice = ref(false)

// Detecção segura de Mobile no ciclo de vida correto (Client-Side)
onMounted(() => {
  isMobileDevice.value = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
})

// Monitora alterações na tarefa sob edição
watch(
  () => props.editingTask,
  (task) => {
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl.value)
    }

    if (task) {
      newTask.value = task.title
      previewUrl.value = task.img_url || null
    } else {
      newTask.value = ''
      previewUrl.value = null
    }

    imgAttachmentKey.value = null
    showCameraCapture.value = false
  },
  { immediate: true }
)

// Helper para limpar previsualizações locais sem revogar links remotos (http)
function limparPrevisualizacao() {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  imgAttachmentKey.value = null
  showCameraCapture.value = false
}

// Upload via arquivo padrão
async function handleImageChange(event) {
  const file = event.target.files[0]
  if (!file) return
  await processarEEnviarImagem(file)
}

// Upload via captura customizada da câmera
async function handleCameraCapture(file) {
  await processarEEnviarImagem(file)
  showCameraCapture.value = false
}

// Abstração da lógica de tratamento e upload da imagem
async function processarEEnviarImagem(file) {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
  uploading.value = true

  try {
    const response = await tasksApi.uploadImage(file)
    imgAttachmentKey.value = response.data.attachment_key
  } catch (err) {
    console.error('Erro ao fazer upload da imagem:', err)
    previewUrl.value = null
    imgAttachmentKey.value = null
  } finally {
    uploading.value = false
  }
}

function handleSubmit() {
  if (!newTask.value.trim()) return

  const payload = {
    title: newTask.value.trim(),
    imgAttachmentKey: imgAttachmentKey.value,
    previewUrl: previewUrl.value,
  }

  if (props.editingTask) {
    emit('update', props.editingTask.id, payload)
  } else {
    emit('add', payload)
  }

  newTask.value = ''
  limparPrevisualizacao()
}

function handleCancel() {
  newTask.value = ''
  limparPrevisualizacao()
  emit('cancel')
}
</script>

<style scoped>
.task-form {
  margin-bottom: 24px;
}

.task-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.task-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.task-input:focus {
  border-color: #642db8;
  box-shadow: 0 0 0 3px rgba(100, 45, 184, 0.15);
}

.task-button {
  padding: 12px 20px;
  background-color: #642db8;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.task-button:hover:not(:disabled) {
  background-color: #4e2294;
}

.task-button:active:not(:disabled) {
  transform: scale(0.98);
}

.task-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-button-cancel {
  padding: 12px 16px;
  background-color: transparent;
  color: #555;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.task-button-cancel:hover {
  background-color: #f1f1f1;
  border-color: #bbb;
}

.image-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1.5px dashed #ccc;
}

.image-preview {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

.image-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: white;
  border: 1.5px solid #4a90d9;
  color: #4a90d9;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.image-label:hover:not(.disabled) {
  background: #eaf2fb;
  border-color: #2a72c2;
  color: #2a72c2;
}

.image-label.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #eee;
  border-color: #ccc;
  color: #888;
}

.task-button-secondary {
  padding: 10px 16px;
  background: white;
  color: #666;
  border: 1.5px solid #ccc;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.task-button-secondary:hover {
  background: #f1f1f1;
  border-color: #999;
  color: #333;
}

.image-input {
  display: none;
}

.upload-status {
  color: #666;
  font-weight: 500;
}

.image-help {
  font-size: 0.75rem;
  color: #777;
  margin: 4px 0 0 0;
  flex-basis: 100%;
}

/* 📱 --- REGRAS DE MEIOS / MEDIA QUERIES PARA MOBILE --- */
@media (max-width: 580px) {
  .task-row {
    flex-direction: column; /* Input em cima, botões embaixo */
    gap: 10px;
  }

  .task-input {
    width: 100%; /* Ocupa tudo */
  }

  /* Cria um container invisível flexível para os botões ficarem emparelhados */
  .task-button,
  .task-button-cancel {
    width: 100%;
    text-align: center;
    padding: 14px; /* Área de toque um pouco maior para Mobile */
  }

  .image-section {
    gap: 10px;
    padding: 10px;
  }

  /* Modifica os botões de ação com imagem para ocupar linhas cheias se necessário */
  .image-label,
  .task-button-secondary {
    flex: 1; /* Dividem o espaço uniformemente se estiverem na mesma linha */
    min-width: 140px;
    padding: 12px;
    font-size: 0.85rem;
  }

  .image-preview {
    width: 48px;
    height: 48px;
  }
}
</style>
