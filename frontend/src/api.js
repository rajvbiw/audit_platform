import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': localStorage.getItem('apiKey') || ''
  }
})

// Interceptor to update API key header if it changes
api.interceptors.request.use(config => {
  const key = localStorage.getItem('apiKey')
  if (key) config.headers['X-API-Key'] = key
  return config
})

export default api