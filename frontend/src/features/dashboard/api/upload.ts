import { uploadAPI } from '@/services/api'

export async function uploadDashboardImage(file: File) {
  return uploadAPI.uploadImage(file)
}
