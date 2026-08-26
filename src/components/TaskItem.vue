<template>
  <div class="task-item" :class="{ done: task.done }">
    <!-- Indicadores visuais lado a lado -->
    <div class="task-indicators">
      <!-- Ícone de Câmera (exibido se houver imagem) -->
      <button
        v-if="task.img_url"
        class="img-indicator"
        @click="handleOpenModal"
        title="Ver imagem e localização"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
          />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      <!-- Ícone de Pin de Localização (exibido se houver coordenadas) -->
      <button
        v-if="hasGeolocation"
        class="geo-indicator-btn"
        @click="handleOpenModal"
        :title="displayAddress || 'Ver localização'"
      >
        📍
      </button>
    </div>

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
      <span
        v-if="task.location_label"
        class="task-location-tag"
        :title="task.location_label"
      >
        📍 {{ task.location_label }}
      </span>

      <img v-if="task.img_url" :src="task.img_url" alt="Imagem da tarefa" class="dialog-img" />

      <!-- Bloco de Geolocalização -->
      <div v-if="hasGeolocation" class="dialog-geo-info">
        <div class="geo-header">
          <span class="geo-icon">📍</span>
          <strong>Localização da Captura</strong>
        </div>

        <ul class="geo-details">
          <li v-if="displayAddress"><strong>Endereço:</strong> {{ displayAddress }}</li>
          <li><strong>Coordenadas:</strong> {{ formattedCoordinates }}</li>
          <li
            v-if="
              task.geolocation_accuracy !== undefined &&
              task.geolocation_accuracy !== null
            "
          >
            <strong>Precisão:</strong> ~{{ Math.round(task.geolocation_accuracy) }}m
          </li>
          <li v-if="task.geolocation_timestamp">
            <strong>Data/Hora:</strong> {{ formattedTimestamp }}
          </li>
        </ul>

        <a
          :href="googleMapsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="maps-link"
        >
          🗺️ Abrir no Google Maps
        </a>
      </div>

      <button class="btn-close-dialog" @click="showImage = false">Fechar</button>
    </div>
  </dialog>
</template>

<script setup>
import { ref, computed } from "vue";
import geocodingApi from "../api/geocodingApi.js";

const showImage = ref(false);
const fetchedAddress = ref("");

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
});

defineEmits(["toggle", "remove", "edit"]);

const hasGeolocation = computed(() => {
  return (
    props.task.latitude !== null &&
    props.task.latitude !== undefined &&
    props.task.longitude !== null &&
    props.task.longitude !== undefined &&
    (props.task.latitude !== 0 || props.task.longitude !== 0)
  );
});

const displayAddress = computed(() => {
  return props.task.location_label || fetchedAddress.value;
});

const formattedCoordinates = computed(() => {
  if (!hasGeolocation.value) return "";
  return `${props.task.latitude.toFixed(5)}, ${props.task.longitude.toFixed(5)}`;
});

const formattedTimestamp = computed(() => {
  if (!props.task.geolocation_timestamp) return "";
  const date = new Date(props.task.geolocation_timestamp);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

const googleMapsUrl = computed(() => {
  if (!hasGeolocation.value) return "#";
  return `https://www.google.com/maps?q=${props.task.latitude},${props.task.longitude}`;
});

async function handleOpenModal() {
  showImage.value = true;

  if (hasGeolocation.value && !props.task.location_label && !fetchedAddress.value) {
    try {
      fetchedAddress.value = "Buscando endereço...";
      const res = await geocodingApi.reverse(props.task.latitude, props.task.longitude);
      fetchedAddress.value = res?.label || "Endereço não identificado";
    } catch {
      fetchedAddress.value = "Endereço não disponível";
    }
  }
}
</script>

<style scoped>
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

/* Indicadores laterais */
.task-indicators {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.img-indicator,
.geo-indicator-btn {
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
  font-size: 0.95rem;
}

.img-indicator:hover,
.geo-indicator-btn:hover {
  color: #642db8;
  background-color: #f1edfa;
}

.task-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.task-label input[type="checkbox"] {
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

.task-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
}

.task-edit,
.task-remove {
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
  color: #642db8;
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

/* Modal */
.image-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
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
  width: 100%;
  max-width: 440px;
  animation: scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.task-location-tag {
  font-size: 0.85rem;
  color: #642db8;
  font-weight: 600;
  text-align: center;
}

.dialog-img {
  width: 100%;
  max-width: 400px;
  max-height: 50vh;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid #eee;
}

.dialog-geo-info {
  width: 100%;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.85rem;
  color: #495057;
  box-sizing: border-box;
}

.geo-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: #642db8;
}

.geo-details {
  list-style: none;
  padding: 0;
  margin: 0 0 8px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.maps-link {
  display: inline-block;
  color: #4a90d9;
  text-decoration: none;
  font-weight: 600;
}

.maps-link:hover {
  text-decoration: underline;
}

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
    max-height: 40vh;
  }

  .btn-close-dialog {
    padding: 12px;
  }
}
</style>
