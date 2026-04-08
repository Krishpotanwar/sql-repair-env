import type {
  ApiInfo,
  BaselineResponse,
  GraderResponse,
  HealthResponse,
  StepResponse,
  TaskInfo,
  TaskObservation,
} from '../types'

const PROD = import.meta.env.PROD
const devEnvBase = import.meta.env.VITE_API_URL?.trim()
const normalizedDevEnvBase = devEnvBase ? devEnvBase.replace(/\/+$/, '') : ''
const BASE = PROD ? '/api' : normalizedDevEnvBase || 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  body: string
  url: string

  constructor(status: number, body: string, url: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.url = url
  }
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${BASE}${normalizedPath}`
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = buildUrl(path)

  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      const err = await res.text()
      throw new ApiError(res.status, err, url, `API error ${res.status}: ${err}`)
    }
    return res.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    const message = error instanceof Error ? error.message : String(error)
    throw new ApiError(0, message, url, `Network error: ${message}`)
  }
}

export function getApiInfo(): ApiInfo {
  return {
    base: BASE,
    mode: PROD ? 'proxy' : normalizedDevEnvBase ? 'direct' : 'local',
    env: PROD ? '(disabled in production)' : normalizedDevEnvBase || '(not set)',
  }
}

export async function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health')
}

export async function fetchTasks(): Promise<TaskInfo[]> {
  const data = await request<{
    tasks: string[]
    details: Array<{ id: string; name: string; difficulty: string }>
  }>('/tasks')
  return data.details.map((task) => ({
    id: task.id,
    name: task.name,
    difficulty: task.difficulty,
  }))
}

export async function resetTask(taskId?: string): Promise<TaskObservation> {
  return request<TaskObservation>('/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskId ? { task_id: taskId } : {}),
  })
}

export async function submitQuery(query: string): Promise<StepResponse> {
  return request<StepResponse>('/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: {
        action_type: 'submit_query',
        query,
      },
    }),
  })
}

export async function gradeTask(taskId?: string): Promise<GraderResponse> {
  return request<GraderResponse>('/grader', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskId ? { task_id: taskId } : {}),
  })
}

export async function fetchBaseline(taskIds?: string[]): Promise<BaselineResponse> {
  return request<BaselineResponse>('/baseline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskIds?.length ? { tasks: taskIds } : {}),
  })
}
