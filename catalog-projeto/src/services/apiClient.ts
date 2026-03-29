import type { ApiErrorResponse } from "@/types/auth";

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 800;

// Só faz retry em erros de servidor (5xx) ou falhas de rede.
// Erros do cliente (4xx) indicam problema na requisição — não adianta tentar de novo.
function shouldRetry(err: unknown): boolean {
  if (err instanceof ApiClientError) return err.status >= 500;
  return true;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
    try {
      return await fn();
    } catch (err) {
      if (!shouldRetry(err)) throw err;
      lastError = err;
    }
  }
  throw lastError;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== "object") return false;
  const error = value as Partial<ApiErrorResponse>;
  return (
    error.status === "error" &&
    typeof error.message === "string" &&
    typeof error.code === "string"
  );
}

interface ApiRequestOptions extends RequestInit {
  /** Se true, retenta automaticamente até 3x em erros 5xx ou falha de rede */
  retry?: boolean;
}

export async function apiRequest<T>(
  path: string,
  init?: ApiRequestOptions
): Promise<T> {
  const { retry = false, ...fetchInit } = init ?? {};

  const execute = async (): Promise<T> => {
    const response = await fetch(path, {
      credentials: "include",
      ...fetchInit,
      headers: {
        "Content-Type": "application/json",
        ...(fetchInit?.headers ?? {}),
      },
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as unknown) : null;

    if (!response.ok) {
      if (isApiErrorResponse(payload)) {
        throw new ApiClientError(payload.message, response.status, payload.code);
      }
      throw new ApiClientError(
        "Erro inesperado ao processar requisicao",
        response.status
      );
    }

    return payload as T;
  };

  return retry ? withRetry(execute) : execute();
}
