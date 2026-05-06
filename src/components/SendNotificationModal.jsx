import React, { useState } from 'react'
import { Bell, Loader2, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogCloseButton,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { supabase } from '../lib/supabase'
import appIcon from '../assets/icon.png'

export function SendNotificationModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState(null)

  const handleClear = () => {
    setTitle('')
    setBody('')
    setStatus(null)
  }

  const truncateWords = (text, maxWords = 12) => {
    if (!text) return ''
    const words = text.trim().split(/\s+/)
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(' ') + '...'
    }
    return text
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    setLoading(true)
    setStatus(null)

    try {
      const { data, error } = await supabase.functions.invoke('broadcast-notification', {
        body: { title, body },
      })

      if (error) throw error

      setStatus({
        type: 'success',
        message: `Successfully sent to ${data?.successCount || 0} devices. (Failed: ${data?.failureCount || 0})`,
      })

      // Clear form on success
      handleClear()

      // Optionally close after a delay
      setTimeout(() => {
        setIsOpen(false)
        setStatus(null)
      }, 3000)
    } catch (error) {
      console.error('Error sending notification:', error)
      setStatus({
        type: 'error',
        message: error.message || 'Failed to send notification',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 hover:cursor-pointer hover:bg-red-400 hover:text-white transition-colors">
          <Bell className="h-4 w-4" />
          Send Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>Broadcast Notification</DialogTitle>
          <DialogDescription>
            Send a push notification to all users' devices. Only admin users can perform this action.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-4 pt-4">
          <div className="flex flex-col md:flex-row gap-8">

            {/* Left Side: Form */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Notification Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. New Course Available!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Notification Body</Label>
                <textarea
                  id="body"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="Enter the main message here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {status && (
                <div
                  className={`p-3 rounded-md text-sm ${status.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                >
                  {status.message}
                </div>
              )}
            </div>

            {/* Right Side: Preview */}
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/80 rounded-xl p-6 border border-gray-200">
              <p className="text-xs text-gray-400 font-bold mb-6 uppercase tracking-widest">Live Preview</p>

              {/* iOS/Android Mockup Banner */}
              <div className="w-full max-w-[320px] bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 p-4 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <img
                      src={appIcon}
                      alt="App Icon"
                      className="w-10 h-10 rounded-lg shadow-sm object-cover bg-indigo-50"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-[13px] truncate tracking-tight">GLD Institute</span>
                      <span className="text-[11px] text-gray-500 whitespace-nowrap">Just now</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-800 leading-snug truncate">
                      {title || 'Notification Title'}
                    </p>
                    <p className="text-[13px] text-gray-600 leading-snug mt-0.5 break-words">
                      {truncateWords(body) || 'Notification body will appear here. Keep it concise to ensure it fits on the lock screen.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              disabled={loading || (!title && !body)}
              className="text-gray-500"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !title.trim() || !body.trim()} className='bg-blue-500 hover:bg-blue-600 hover:cursor-pointer transition-colors'>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Broadcast'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
