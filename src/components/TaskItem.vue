<template>
  <div class="task-item" :class="{ done: task.done }">
    <button v-if="task.img_url" class="img-indicator" @click="showImage = true">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8
             a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
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
  <dialog v-if="showImage" open class="image-dialog">
    <img :src="task.img_url" alt="Imagem da tarefa" />
    <button @click="showImage = false">Fechar</button>
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
.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: opacity 0.2s;
  gap: 10px;
}

.task-thumbnail {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #eee;
  flex-shrink: 0;
}

.task-item.done {
  opacity: 0.6;
}

.task-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex: 1;
}

.task-label input[type='checkbox'] {
  width: 20px;
  height: 20px;
  accent-color: #4a90d9;
}

.task-title {
  font-size: 1rem;
}

.task-item.done .task-title {
  text-decoration: line-through;
  color: #999;
}

.task-remove {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 4px 8px;
}

.task-remove:hover {
  text-decoration: underline;
}

.task-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.task-edit {
  background: none;
  border: none;
  color: #4a90d9;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 4px 8px;
}

.task-edit:hover {
  text-decoration: underline;
}

.img-indicator {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
}

.img-indicator:hover {
  color: #4a90d9;
}

.image-dialog {
  border: none;
  border-radius: 8px;
  padding: 16px;
}

.image-dialog {
  border: none;
  border-radius: 8px;
  padding: 16px;

  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);

  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

</style>
