/**
 * Core data models and type definitions
 */

export interface Todo {
  id: string;
  userId: string;
  title: string;
  status: "pending" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
}

export interface ApiResponse {
  statusCode: number;
  body: string;
  headers: {
    "Content-Type": "application/json";
    "Access-Control-Allow-Origin": "*";
    [key: string]: string;
  };
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface SuccessResponse<T> {
  data: T;
}

export type TodoStatus = "pending" | "completed";
