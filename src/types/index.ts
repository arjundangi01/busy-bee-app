export type IApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};
