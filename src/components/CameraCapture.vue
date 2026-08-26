<template>
  <div class="camera-capture">

    <video
      ref="videoRef"
      autoplay
      playsinline
      class="camera-preview"
      :class="{ hidden: captured }"
    ></video>

    <img
      v-if="capturedUrl"
      :src="capturedUrl"
      class="camera-result"
      alt="Foto capturada"
    />

    <div class="camera-actions">
      <!-- Tira a foto se a câmera estiver ativa e ainda não tiver capturado -->
      <button
        v-if="streamActive && !captured"
        type="button"
        class="camera-btn"
        @click="capturePhoto"
      >
        Fotografar
      </button>

      <!-- Permite refazer a foto se já capturou -->
      <button
        v-if="captured"
        type="button"
        class="camera-btn secondary"
        @click="retake"
      >
        Refazer
      </button>

      <!-- Botão para fechar a câmera -->
      <button
        type="button"
        class="camera-btn danger"
        @click="closeCamera"
      >
        Fechar câmera
      </button>
    </div>

    <p v-if="error" class="camera-error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['captured', 'close']);

const videoRef = ref(null);
const captured = ref(false);
const capturedUrl = ref(null);
const capturedFile = ref(null);
const streamActive = ref(false);
const error = ref(null);
let stream = null;

// Inicializa a câmera assim que o componente é montado na tela
onMounted(() => {
  startCamera();
});

// Garante que o hardware da câmera seja liberado se o componente for destruído
onUnmounted(() => {
  stopStream();
});

async function startCamera() {
  error.value = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
    streamActive.value = true;
    captured.value = false;
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      error.value = 'Permissão de câmera negada.';
    } else if (err.name === 'NotFoundError') {
      error.value = 'Nenhuma câmera encontrada.';
    } else {
      error.value = 'Erro ao acessar a câmera.';
    }
    console.error(err);
  }
}

function capturePhoto() {
  const video = videoRef.value;
  if (!video) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  canvas.toBlob(
    (blob) => {
      const file = new File([blob], 'camera-capture.jpg', {
        type: 'image/jpeg',
      });
      capturedUrl.value = URL.createObjectURL(blob);
      capturedFile.value = file;
      captured.value = true;
      emit('captured', file);
    },
    'image/jpeg',
    0.9,
  );
}

function retake() {
  if (capturedUrl.value) URL.revokeObjectURL(capturedUrl.value);
  capturedUrl.value = null;
  capturedFile.value = null;
  captured.value = false;
}

function stopStream() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  streamActive.value = false;
}

function closeCamera() {
  stopStream();
  if (capturedUrl.value) URL.revokeObjectURL(capturedUrl.value);
  capturedUrl.value = null;
  capturedFile.value = null;
  captured.value = false;
  emit('close');
}
</script>

<style scoped>
.camera-capture {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.camera-preview {
  width: 100%;
  max-width: 400px;
  max-height: 300px;
  object-fit: contain;
  background: #000;
  border-radius: 8px;
  align-self: center; /* Força o alinhamento central no container Flex */
}

.camera-preview.hidden {
  display: none;
}

.camera-result {
  width: 100%;
  max-width: 400px;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  border: 2px solid #642db8;
  align-self: center; /* Força o alinhamento central no container Flex */
}

.camera-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.camera-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  background: #642db8;
  color: white;
}

.camera-btn.secondary {
  background: #6c757d;
}

.camera-btn.danger {
  background: #e74c3c;
}

.camera-error {
  color: #e74c3c;
  font-size: 0.85rem;
}
</style>
