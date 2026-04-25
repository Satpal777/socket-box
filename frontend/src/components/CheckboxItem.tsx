import { useState } from 'react'

interface Checkbox {
  id: string
  checked: number
  updatedBy: string | null
}

interface CheckboxItemProps {
  checkbox: Checkbox
  onToggle: (id: string, checked: boolean) => void
}

const getAvatarUrl = (userId: string | null) => {
  if (!userId) return null
  // DiceBear API - generates random avatars from seed (userId)
  // You can change style: adventurer, avataaars, bottts, croodles, etc.
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userId)}`
}

export default function CheckboxItem({ checkbox, onToggle }: CheckboxItemProps) {
  const [imageError, setImageError] = useState(false)
  const isChecked = checkbox.checked === 1
  const avatarUrl = getAvatarUrl(checkbox.updatedBy)

  return (
    <div 
      className={`checkbox-square ${isChecked ? 'checked' : 'empty'}`}
      onClick={() => onToggle(checkbox.id, !isChecked)}
      title={checkbox.id}
    >
      {isChecked && avatarUrl && !imageError && (
        <img
          src={avatarUrl}
          alt={`Avatar`}
          className="avatar-image"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  )
}
