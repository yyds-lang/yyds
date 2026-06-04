export interface FormatWorkerRequest {
  id: number
  source: string
}

export interface FormatWorkerSuccessResponse {
  id: number
  ok: true
  payload: {
    source: string
  }
}

export interface FormatWorkerErrorResponse {
  id: number
  ok: false
  error: string
}

export type FormatWorkerResponse = FormatWorkerSuccessResponse | FormatWorkerErrorResponse
