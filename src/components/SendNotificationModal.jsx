import React, { useState } from 'react'
import { Bell, Loader2 } from 'lucide-react'
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

export function SendNotificationModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', message: string }

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
      setTitle('')
      setBody('')

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
        <Button variant="outline" className="gap-2 hover:cursor-pointer hover:bg-red-400 hover:text-white">
          <Bell className="h-4 w-4" />
          Send Notification
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>Broadcast Notification</DialogTitle>
          <DialogDescription>
            Send a push notification to all users' devices. Only admin users can perform this action.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-4 py-4">
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
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || !body.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Broadcast'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
