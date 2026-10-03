import axios from 'axios'

export const BASE_URL = 'https://eduresource-ad12d-default-rtdb.asia-southeast1.firebasedatabase.app/'

function stripId(data) {
  const { id: _id, ...rest } = data || {}
  return rest
}

/**
 * BaseAPI - Lớp giao tiếp trực tiếp với Firebase Realtime Database REST API
 */
export class BaseAPI {
  constructor(endpoint) {
    this.endpoint = endpoint
    this.baseUrl = BASE_URL
  }

  /**
   * Lấy toàn bộ danh sách bản ghi và tự động chuyển đổi Object { id: {...} } sang mảng [{ id, ... }]
   */
  async getAll() {
    const res = await axios.get(`${this.baseUrl}${this.endpoint}.json`)
    if (!res.data) return []
    return Object.entries(res.data).map(([id, item]) => ({
      ...item,
      id
    }))
  }

  /**
   * Lấy chi tiết một bản ghi theo ID
   */
  async getOne(id) {
    const res = await axios.get(`${this.baseUrl}${this.endpoint}/${id}.json`)
    if (!res.data) return null
    return { ...res.data, id }
  }

  /**
   * Tạo mới bản ghi (POST sinh ID tự động)
   */
  async store(data) {
    try {
      const now = new Date().toISOString()
      const payload = {
        ...stripId(data),
        createdAt: data.createdAt || now,
        updatedAt: now
      }
      const res = await axios.post(`${this.baseUrl}${this.endpoint}.json`, payload)
      return { id: res.data.name, ...payload }
    } catch (error) {
      console.error(`Lỗi khi tạo mới ${this.endpoint}:`, error)
      throw error
    }
  }

  /**
   * Lưu bản ghi với ID chỉ định (PUT) - ví dụ users/{uid}
   */
  async setWithId(id, data) {
    try {
      const now = new Date().toISOString()
      const payload = {
        ...stripId(data),
        updatedAt: now
      }
      await axios.put(`${this.baseUrl}${this.endpoint}/${id}.json`, payload)
      return { id, ...payload }
    } catch (error) {
      console.error(`Lỗi khi lưu ${this.endpoint}/${id}:`, error)
      throw error
    }
  }

  /**
   * Cập nhật bản ghi (PATCH chỉ sửa các trường thay đổi)
   */
  async update(id, data) {
    try {
      const now = new Date().toISOString()
      const payload = {
        ...stripId(data),
        updatedAt: now
      }
      await axios.patch(`${this.baseUrl}${this.endpoint}/${id}.json`, payload)
      return { id, ...payload }
    } catch (error) {
      console.error(`Lỗi khi cập nhật ${this.endpoint}/${id}:`, error)
      throw error
    }
  }

  /**
   * Xóa bản ghi theo ID (DELETE)
   */
  async delete(id) {
    try {
      await axios.delete(`${this.baseUrl}${this.endpoint}/${id}.json`)
      return true
    } catch (error) {
      console.error(`Lỗi khi xóa ${this.endpoint}/${id}:`, error)
      throw error
    }
  }
}
