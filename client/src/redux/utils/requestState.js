export const REQUEST_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
};

export const EMPTY_REQUEST_STATE = Object.freeze({
  status: REQUEST_STATUS.IDLE,
  error: null,
  data: undefined,
});

export const createRequestState = () => ({
  status: REQUEST_STATUS.IDLE,
  error: null,
  data: undefined,
});

const resolveMessage = (value, fallback = "Request failed") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (typeof value.message === "string" && value.message) return value.message;
  if (typeof value?.data?.message === "string" && value.data.message) return value.data.message;
  return fallback;
};

export const toApiError = (value, fallbackMessage) => ({
  ...(value?.data?.message && value?.status
    ? value
    : {
        status: value?.statusCode || value?.status || 500,
        data: {
          message: resolveMessage(value, fallbackMessage || "Request failed"),
          errors: value?.errors || value?.data?.errors,
        },
        original: value || null,
      }),
});

export const setPendingState = (target, options = {}) => {
  const { keepData = true } = options;
  target.status = REQUEST_STATUS.LOADING;
  target.error = null;
  if (!keepData) {
    target.data = undefined;
  }
};

export const setFulfilledState = (target, payload) => {
  target.status = REQUEST_STATUS.SUCCEEDED;
  target.error = null;
  target.data = payload;
};

export const setRejectedState = (target, errorPayload, fallbackMessage) => {
  target.status = REQUEST_STATUS.FAILED;
  target.error = toApiError(errorPayload, fallbackMessage);
};

export const isLoadingState = (requestState) => requestState?.status === REQUEST_STATUS.LOADING;
