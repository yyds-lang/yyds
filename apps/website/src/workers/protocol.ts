export type WorkerRequest =
  | {
      id: number
      type: 'init'
    }
  | {
      id: number
      type: 'render'
      payload: {
        source: string
        instrument: string
      }
    }

export type WorkerSuccessResponse =
  | {
      id: number
      ok: true
      type: 'init'
    }
  | {
      id: number
      ok: true
      type: 'render'
      payload: {
        wav: ArrayBuffer
        size: number
        durationSeconds: number
        roll: {
          notes: Array<{
            start: number
            duration: number
            pitch: number
            velocity: number
            symbol: string
            instrument: string
          }>
          totalTicks: number
          minPitch: number
          maxPitch: number
          tempo: number
        }
      }
    }

export interface WorkerErrorResponse {
  id: number
  ok: false
  error: string
}

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse
