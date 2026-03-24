import type { ApiErrorResponse } from "@/types/auth";

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

export async function apiRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
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
}
