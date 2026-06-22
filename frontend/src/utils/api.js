const BASE_URL = '/api'

async function request(url, options = {}) {
  const response = await fetch(BASE_URL + url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || '请求失败')
  }
  
  return data
}

export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return fetch(BASE_URL + '/upload', {
    method: 'POST',
    body: formData
  }).then(res => res.json())
}

export function getUploads() {
  return request('/uploads')
}

export function getHistory() {
  return request('/history')
}

export function saveHistory(item) {
  return request('/history', {
    method: 'POST',
    body: JSON.stringify(item)
  })
}

export function deleteHistory(id) {
  return request(`/history/${id}`, {
    method: 'DELETE'
  })
}

export function clearHistory() {
  return request('/history', {
    method: 'DELETE'
  })
}
