import type { InstructionResponse } from '../api'
import styles from './InstructionStep.module.css'

interface InstructionStepProps {
  instruction: InstructionResponse
  mixTitle: string
  onNext: () => void
}

export function InstructionStep({ instruction, mixTitle, onNext }: InstructionStepProps) {
  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>{instruction.headline}</h2>
      <p className={styles.mixTitle}>{mixTitle}</p>

      <section className={styles.section}>
        <h3>Чаша</h3>
        <ul>
          {instruction.bowl.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Жар</h3>
        <ul>
          {instruction.heat.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Если не открыт</h3>
        <ul>
          {instruction.if_not_opened.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Курение</h3>
        <ul>
          {instruction.smoke.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Тюнинг</h3>
        <ul>
          {instruction.tuning.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </section>

      <button type="button" className={styles.next} onClick={onNext}>
        Оценить →
      </button>
    </div>
  )
}
