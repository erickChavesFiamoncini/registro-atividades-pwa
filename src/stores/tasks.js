import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import tasksApi from '../api/tasksApi.js'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([])
  const loading = ref(false)
  const error = ref(null)

  const pendingTasks = computed(() => tasks.value.filter((t) => !t.done))
  const completedTasks = computed(() => tasks.value.filter((t) => t.done))

  async function fetchTasks() {
    loading.value = true
    error.value = null
    try {
      const response = await tasksApi.getAll()
      tasks.value = response.data
    } catch (err) {
      error.value = 'Erro ao carregar tarefas.'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  async function addTask(payload) {
    if (!payload.title?.trim()) return
    error.value = null
    try {
      const response = await tasksApi.create(payload)

      const newTask = response.data

      if (!newTask.img_url && payload.previewUrl) {
        newTask.img_url = payload.previewUrl
      }

      tasks.value.push(newTask)
    } catch (err) {
      error.value = 'Erro ao adicionar tarefa.'
      console.error(err)
    }
  }

  async function toggleTask(id) {
    const task = tasks.value.find((t) => t.id === id)
    if (!task) return
    error.value = null
    try {
      const response = await tasksApi.update(id, { done: !task.done })
      const index = tasks.value.findIndex((t) => t.id === id)
      if (index !== -1) tasks.value[index] = response.data
    } catch (err) {
      error.value = 'Erro ao atualizar tarefa.'
      console.error(err)
    }
  }

  async function removeTask(id) {
    error.value = null
    try {
      await tasksApi.remove(id)
      tasks.value = tasks.value.filter((t) => t.id !== id)
    } catch (err) {
      error.value = 'Erro ao remover tarefa.'
      console.error(err)
    }
  }

  async function updateTask(id, payload = {}) {
    if (payload.title !== undefined && !payload.title.trim()) return

    error.value = null

    try {
      const response = await tasksApi.update(id, payload)

      const index = tasks.value.findIndex((t) => t.id === id)

      if (index !== -1) {
        // Unimos a resposta da API garantindo que, se o payload mandou img_url ou localização como null/undefined,
        // o estado local seja sobrescrito imediatamente.
        const updatedTask = {
          ...tasks.value[index],
          ...response.data,
        }

        if (payload.img_url === null) {
          updatedTask.img_url = null;
        }

        if (payload.latitude === null) {
          updatedTask.latitude = null;
          updatedTask.longitude = null;
          updatedTask.location_label = null;
          updatedTask.geolocation_accuracy = null;
          updatedTask.geolocation_timestamp = null;
        }

        tasks.value[index] = updatedTask
      }
    } catch (err) {
      error.value = 'Erro ao editar tarefa.'
      console.error(err)
    }
  }

  return {
    tasks,
    loading,
    error,
    pendingTasks,
    completedTasks,
    fetchTasks,
    addTask,
    toggleTask,
    removeTask,
    updateTask,
  }
})
