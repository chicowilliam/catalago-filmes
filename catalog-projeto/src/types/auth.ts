export interface AuthUser {
  username: string;
  role: "admin";
}

export interface LoginSuccessResponse {
  status: "success";
  message: string;
  user: AuthUser;
}

export interface MeSuccessResponse {
  status: "success";
  user: AuthUser;
}

export interface ApiErrorResponse {
  status: "error";
  code: string;
  message: string;
}
