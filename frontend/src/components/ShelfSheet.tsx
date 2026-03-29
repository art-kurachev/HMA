import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadShelf, saveShelf } from '../shelfStorage'
import { AddCircleIcon, CloseIcon, MinusCircleIcon } from './Icons'
import styles from './ShelfSheet.module.css'

/**
 * Распознавание табаков по фото (GigaChat) отключено — см. README.
 * Вернуть: импорты recognizeShelfFromPhoto, compressShelfImageForUpload,
 * ref file input, кнопку «Сделать фото», обработчик onPhotoSelected.
 */

interface ShelfSheetProps {
  telegramId: number
  onClose: () => void
}

export function ShelfSheet({ telegramId, onClose }: ShelfSheetProps) {
  const [tobaccos, setTobaccos] = useState<string[]>([])

  useEffect(() => {
    setTobaccos(loadShelf(telegramId))
  }, [telegramId])

  const persist = (next: string[]) => {
    setTobaccos(next)
    saveShelf(telegramId, next)
  }

  const add = () => {
    persist([...tobaccos, ''])
  }

  const remove = (index: number) => {
    persist(tobaccos.filter((_, i) => i !== index))
  }

  const update = (index: number, value: string) => {
    const next = [...tobaccos]
    next[index] = value
    persist(next)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const content = (
    <div className={styles.backdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="Полка табаков">
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Полка табаков</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <CloseIcon size={24} />
          </button>
        </div>

        <div className={styles.listScroll}>
          {tobaccos.map((name, index) => (
            <div key={index} className={styles.row}>
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => update(index, e.target.value)}
                placeholder="Название табака"
                aria-label={`Табак ${index + 1}`}
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => remove(index)}
                aria-label="Удалить"
              >
                <MinusCircleIcon size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.sheetFooter}>
          <div className={styles.actionsRow}>
            <button type="button" className={styles.addRow} onClick={add}>
              <span>Добавить табак</span>
              <AddCircleIcon className={styles.addRowIcon} size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
  return createPortal(content, document.body)
}
