import apiClient from './config.js'

const tasksApi = {
  getAll() {
    return apiClient.get('/tasks')
  },

create(payload) {
  console.log('PAYLOAD ENVIADO:', payload)
  console.log('TIMESTAMP:', payload.geolocation_timestamp)
  console.log(
    'TIPO:',
    typeof payload.geolocation_timestamp,
    payload.geolocation_timestamp instanceof Date
  )

  return apiClient.post('/tasks', payload)
},

  update(id, data) {
    return apiClient.patch(`/tasks/${id}`, data)
  },

  remove(id) {
    return apiClient.delete(`/tasks/${id}`)
  },

  uploadImage(file, description = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    return apiClient.post('/uploads/images/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default tasksApi
