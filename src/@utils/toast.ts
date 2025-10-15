import { toast, Id, ToastOptions } from 'react-toastify'

// Show a persistent loading toast (caller provides the message)
export function showUploadingToast(
  message: string,
  options?: ToastOptions
): Id | undefined {
  try {
    return toast.loading(message, {
      autoClose: false,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      closeButton: false,
      ...options
    })
  } catch {
    return undefined
  }
}

export function updateToastSuccess(
  id: Id | null | undefined,
  message: string,
  autoClose = 8000
) {
  try {
    if (id !== undefined && id !== null) {
      toast.update(id, {
        render: message,
        type: 'success',
        isLoading: false,
        autoClose,
        hideProgressBar: false,
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        closeOnClick: true,
        closeButton: true
      })
    } else {
      toast.success(message, {
        autoClose,
        hideProgressBar: false,
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        closeOnClick: true,
        closeButton: true
      })
    }
  } catch {
    try {
      toast.success(message, {
        autoClose,
        hideProgressBar: false,
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        closeOnClick: true,
        closeButton: true
      })
    } catch {}
  }
}

export function updateToastError(
  id: Id | null | undefined,
  message: string,
  autoClose = 10000
) {
  try {
    if (id !== undefined && id !== null) {
      toast.update(id, {
        render: message,
        type: 'error',
        isLoading: false,
        autoClose,
        hideProgressBar: false,
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        closeOnClick: true,
        closeButton: true
      })
    } else {
      toast.error(message, {
        autoClose,
        hideProgressBar: false,
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        closeOnClick: true,
        closeButton: true
      })
    }
  } catch {
    try {
      toast.error(message, {
        autoClose,
        hideProgressBar: false,
        pauseOnHover: true,
        pauseOnFocusLoss: true,
        closeOnClick: true,
        closeButton: true
      })
    } catch {}
  }
}

export function dismissToast(id?: Id) {
  try {
    if (id !== undefined) toast.dismiss(id)
  } catch {}
}
