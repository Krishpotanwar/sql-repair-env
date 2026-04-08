export type HealthStatus = 'loading' | 'ok' | 'error'

export interface ApiInfo {
  base: string
  mode: 'proxy' | 'direct' | 'local'
  env: string
}

export type SqlCell = string | number | boolean | null
export type SqlRow = SqlCell[]

export interface HealthResponse {
  status: string
  [key: string]: unknown
}

export interface TaskInfo {
  id: string
  name: string
  difficulty: string
}

export interface TaskObservation {
  task_id: string
  name: string
  difficulty: string
  schema_sql: string
  broken_query: string
  broken_query_error: string | null
  broken_query_executes: boolean
  hint: string
  expected_row_count: number
  expected_column_count: number
  step_count: number
  max_steps: number
  remaining_steps: number
  submitted_query?: string
  error?: string | null
  executed?: boolean
  matches_expected?: boolean
  result_row_count?: number
  result_preview?: SqlRow[] | null
  expected_preview?: SqlRow[] | null
}

export interface StepResponse {
  observation: TaskObservation
  reward: number
  done: boolean
  info: {
    solved: boolean
    [key: string]: unknown
  }
}

export interface GraderResponse {
  task_id: string
  score: number
}

export interface BaselineResponse {
  scores: Record<string, number>
  max_steps: number
}

export interface TaskCatalogEntry {
  id: string
  story: string
  whyItFails: string
  schemaStatements: string[]
  canonicalQuery: string
  validationSignal: string
}
