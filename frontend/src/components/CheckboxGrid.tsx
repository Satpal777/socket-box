import { useState, useEffect } from 'react';
import axios from 'axios';
import CheckboxItem from './CheckboxItem';
import { io } from 'socket.io-client';

const socket = io("http://localhost:5000");

interface Checkbox {
  id: string
  checked: number
  updatedBy: string | null
}

interface CheckboxGridProps {
  userId: string
}

export default function CheckboxGrid({ userId }: CheckboxGridProps) {
  const [checkboxes, setCheckboxes] = useState<Checkbox[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCheckboxes();

    socket.on("checkbox:updated", (updatedBox: Checkbox) => {
    console.log('📡 Received box:sync event:', updatedBox);
      setCheckboxes((prev) =>
        prev.map((cb) => (cb.id === updatedBox.id ? updatedBox : cb))
      );
    });

    return () => {
      socket.off("box:sync")
    }
  }, [])

  const fetchCheckboxes = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📡 Fetching checkboxes from /api/checkboxes...')
      const response = await axios.get('/api/checkboxes')
      console.log('✅ Checkboxes fetched:', response.data)
      setCheckboxes(response.data)
    } catch (error) {
      console.error('❌ Failed to fetch checkboxes:', error)
      setError('Failed to load checkboxes. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (checkboxId: string, newState: boolean) => {
    try {
      console.log(`📤 Updating checkbox ${checkboxId} to ${newState}`)
      await axios.post(`/api/checkboxes/${checkboxId}/toggle`, {
        checked: newState ? 1 : 0,
        userId
      })

      setCheckboxes(checkboxes.map(cb =>
        cb.id === checkboxId
          ? { ...cb, checked: newState ? 1 : 0, updatedBy: userId }
          : cb
      ))
    } catch (error) {
      console.error('❌ Failed to toggle checkbox:', error)
      setError('Failed to update checkbox')
    }
  }

  if (loading) {
    return <div className="loading">Loading checkboxes...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  if (checkboxes.length === 0) {
    return <div className="empty">No checkboxes available. Seed the database with: pnpm db:seed</div>
  }

  return (
    <div className="checkbox-grid">
      {checkboxes.map(checkbox => (
        <CheckboxItem
          key={checkbox.id}
          checkbox={checkbox}
          onToggle={handleToggle}
        />
      ))}
    </div>
  )
}
