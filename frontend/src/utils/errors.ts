import axios from 'axios'

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return 'Could not reach the server. Check your connection.'
    }
    return err.response.data?.message ?? fallback
  }
  return fallback
}
