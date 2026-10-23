import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5193/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Injects Bearer token from localStorage or sessionStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      localStorage.getItem('enterprise_token') ||
      sessionStorage.getItem('enterprise_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Helper to extract a clean, user-friendly message from any API / Axios error
export function extractApiErrorMessage(
  error: unknown,
  fallbackMessage = 'No se pudo completar la operación. Verifica los datos e inténtalo de nuevo.'
): string {
  if (!error) return fallbackMessage;

  if (axios.isAxiosError(error)) {
    // Network or connection error (backend unreachable / timeout)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'El servidor tardó demasiado en responder. Por favor, inténtalo nuevamente.';
      }
      return 'No fue posible conectar con el servidor. Verifica tu conexión o que el servicio esté activo.';
    }

    const { status, data } = error.response as {
      status: number;
      data?: unknown;
    };

    if (typeof data === 'string' && data.trim().length > 0) {
      return translateKnownMessage(data.trim());
    }

    if (data && typeof data === 'object') {
      const payload = data as Record<string, unknown>;

      // 1. ProblemDetails.detail (most descriptive backend message)
      if (typeof payload.detail === 'string' && payload.detail.trim().length > 0) {
        // Also check if ValidationProblemDetails has field-level errors
        if (payload.errors && typeof payload.errors === 'object' && !Array.isArray(payload.errors)) {
          const fieldMessages = Object.values(payload.errors as Record<string, unknown>)
            .flatMap((val) => (Array.isArray(val) ? val : [val]))
            .filter((msg): msg is string => typeof msg === 'string' && msg.trim().length > 0);
          if (fieldMessages.length > 0) {
            return fieldMessages.map(translateKnownMessage).join(' ');
          }
        }
        return translateKnownMessage(payload.detail.trim());
      }

      // 2. Array of errors (AuthResult.errors / IdentityOperationResult.errors)
      if (Array.isArray(payload.errors) && payload.errors.length > 0) {
        const list = payload.errors
          .filter((msg): msg is string => typeof msg === 'string' && msg.trim().length > 0)
          .map(translateKnownMessage);
        if (list.length > 0) {
          return list.join(' ');
        }
      }

      // 3. Dictionary of validation errors (FluentValidation / ASP.NET ValidationProblemDetails)
      if (payload.errors && typeof payload.errors === 'object' && !Array.isArray(payload.errors)) {
        const fieldMessages = Object.values(payload.errors as Record<string, unknown>)
          .flatMap((val) => (Array.isArray(val) ? val : [val]))
          .filter((msg): msg is string => typeof msg === 'string' && msg.trim().length > 0)
          .map(translateKnownMessage);
        if (fieldMessages.length > 0) {
          return fieldMessages.join(' ');
        }
      }

      // 4. Direct message property
      if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
        return translateKnownMessage(payload.message.trim());
      }

      // 5. ProblemDetails.title (if not a generic HTTP status title)
      if (
        typeof payload.title === 'string' &&
        payload.title.trim().length > 0 &&
        !['Bad Request', 'One or more validation errors occurred.', 'Validation Failure'].includes(
          payload.title.trim()
        )
      ) {
        return translateKnownMessage(payload.title.trim());
      }
    }

    // Friendly status-based fallbacks (never "Request failed with status code 400")
    switch (status) {
      case 400:
        return 'Los datos enviados no son válidos. Por favor revisa la información ingresada.';
      case 401:
        return 'Credenciales inválidas o tu sesión ha expirado. Por favor inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos suficientes para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no fue encontrado o ya no está disponible.';
      case 409:
        return 'Conflicto con el estado actual del registro. Verifica que no esté duplicado.';
      case 500:
      case 502:
      case 503:
        return 'Ocurrió un inconveniente interno en el servidor. Inténtalo nuevamente en unos momentos.';
      default:
        return fallbackMessage;
    }
  }

  if (error instanceof Error && error.message) {
    if (/^Request failed with status code \d+$/i.test(error.message)) {
      return fallbackMessage;
    }
    return translateKnownMessage(error.message);
  }

  return fallbackMessage;
}

function translateKnownMessage(msg: string): string {
  const normalized = msg.trim();
  if (normalized === 'Invalid email or password.') {
    return 'El correo electrónico o la contraseña ingresados son incorrectos. Verifica tus datos e inténtalo nuevamente.';
  }
  if (normalized === 'Incorrect password.') {
    return 'La contraseña actual ingresada es incorrecta.';
  }
  if (normalized === 'Authentication Failed') {
    return 'No se pudo iniciar sesión. Verifica tu correo y contraseña.';
  }
  if (normalized === 'Registration Failed') {
    return 'No se pudo completar el registro. Verifica los datos ingresados.';
  }
  if (normalized === 'No account found with that email address.') {
    return 'No se encontró ninguna cuenta asociada a ese correo electrónico.';
  }
  return normalized;
}

// Response Interceptor: Normalizes error messages, handles 401 session expiry, and parses blob errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // If the error response is a Blob (e.g. from failed file download), parse it as JSON
    if (error.response && error.response.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        if (text) {
          error.response.data = JSON.parse(text);
        }
      } catch {
        // Keep raw blob if parsing fails
      }
    }

    // Replace generic "Request failed with status code XXX" with descriptive human-readable message
    error.message = extractApiErrorMessage(error);

    if (error.response) {
      const { status } = error.response;
      const requestUrl = error.config?.url || '';
      const isPublicAuthRequest =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/forgot-password') ||
        requestUrl.includes('/auth/reset-password');

      if (status === 401 && !isPublicAuthRequest) {
        localStorage.removeItem('enterprise_token');
        localStorage.removeItem('enterprise_user');
        sessionStorage.removeItem('enterprise_token');
        sessionStorage.removeItem('enterprise_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Downloads a binary Blob with extracted filename from Content-Disposition header.
 */
export function downloadFileBlob(blob: Blob, fallbackFilename: string, contentDisposition?: string): void {
  let filename = fallbackFilename;

  if (contentDisposition) {
    // Match RFC 5987 filename*=UTF-8''filename.ext
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match && utf8Match[1]) {
      filename = decodeURIComponent(utf8Match[1].trim());
    } else {
      // Match filename="filename.ext" or filename=filename.ext
      const standardMatch = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
      if (standardMatch && standardMatch[1]) {
        filename = standardMatch[1].trim();
      }
    }
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}
