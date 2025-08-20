'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Send } from 'lucide-react'

import {
  Button,
  Textarea,
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui'

const messageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message too long (max 4000 characters)')
})

type MessageFormData = z.infer<typeof messageSchema>

interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({ 
  onSend, 
  disabled = false, 
  placeholder = "Type a message..." 
}: MessageInputProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
    },
  })

  const onSubmit = async (data: MessageFormData) => {
    if (disabled || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSend(data.content)
      form.reset()
    } catch (error) {
      console.error('Failed to send message:', error)
      // Error handling could be improved with toast notifications
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey) {
      e.preventDefault()
      form.handleSubmit(onSubmit)()
    }
  }

  const isFormDisabled = disabled || isSubmitting
  const content = form.watch('content')
  const canSend = content.trim().length > 0 && !isFormDisabled

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-4">
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={placeholder}
                    disabled={isFormDisabled}
                    className="min-h-[60px] max-h-[200px] resize-none"
                    onKeyDown={handleKeyDown}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button
            type="submit"
            disabled={!canSend}
            size="sm"
            className="self-end mb-1"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>
            Press Enter to send, Shift+Enter for new line
          </span>
          <span>
            {content.length}/4000
          </span>
        </div>
      </form>
    </Form>
  )
}