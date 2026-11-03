import React, { createContext, useContext, useState, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Trash2,
} from 'lucide-react'

const ModalContext = createContext(null)

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'confirm', // 'confirm' or 'alert'
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger', // 'danger', 'warning', 'success', 'info'
  })

  const resolverRef = useRef(null)

  const showConfirm = useCallback(
    ({
      title = 'Are you sure?',
      message = '',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      variant = 'danger',
    }) => {
      return new Promise((resolve) => {
        resolverRef.current = resolve
        setModalState({
          isOpen: true,
          type: 'confirm',
          title,
          message,
          confirmText,
          cancelText,
          variant,
        })
      })
    },
    [],
  )

  const showAlert = useCallback(
    ({
      title = 'Notice',
      message = '',
      confirmText = 'OK',
      variant = 'info',
    }) => {
      return new Promise((resolve) => {
        resolverRef.current = resolve
        setModalState({
          isOpen: true,
          type: 'alert',
          title,
          message,
          confirmText,
          cancelText: '',
          variant,
        })
      })
    },
    [],
  )

  const handleConfirm = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
    if (resolverRef.current) {
      resolverRef.current(true)
      resolverRef.current = null
    }
  }

  const handleCancel = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
    if (resolverRef.current) {
      resolverRef.current(false)
      resolverRef.current = null
    }
  }

  const renderIcon = () => {
    switch (modalState.variant) {
      case 'danger':
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
            <Trash2 className="h-5 w-5" />
          </div>
        )
      case 'warning':
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
            <AlertTriangle className="h-5 w-5" />
          </div>
        )
      case 'success':
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        )
      case 'info':
      default:
        return (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
            <Info className="h-5 w-5" />
          </div>
        )
    }
  }

  const getConfirmButtonClass = () => {
    switch (modalState.variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm'
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm'
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm'
    }
  }

  return (
    <ModalContext.Provider value={{ confirm: showConfirm, alert: showAlert }}>
      {children}

      <Dialog
        open={modalState.isOpen}
        onOpenChange={(open) => {
          if (!open) handleCancel()
        }}
      >
        <DialogContent className="max-w-md bg-white p-6 rounded-xl shadow-2xl border border-gray-100">
          <div className="flex items-start gap-4">
            {renderIcon()}
            <div className="flex-1 min-w-0">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-gray-900 leading-tight">
                  {modalState.title}
                </DialogTitle>
                {modalState.message ? (
                  <DialogDescription className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                    {modalState.message}
                  </DialogDescription>
                ) : null}
              </DialogHeader>
            </div>
          </div>

          <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2.5">
            {modalState.type === 'confirm' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="px-4 text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-100"
                >
                  {modalState.cancelText || 'Cancel'}
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  className={`px-4 text-sm font-semibold ${getConfirmButtonClass()}`}
                >
                  {modalState.confirmText || 'Confirm'}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={handleConfirm}
                className="px-5 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
              >
                {modalState.confirmText || 'Got It'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  )
}

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
