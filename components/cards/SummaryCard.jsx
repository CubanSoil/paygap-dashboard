import styles from './SummaryCard.module.css';

export default function SummaryCard({ title, value, subtitle }) {
  return (
    <div className={styles['summary-card']} style={{'--d': '0.2s'}}>
      <div className={styles['summary-card-title']}>{title}</div>
      <div className={styles['summary-card-value']}>
        {value !== undefined && value !== null ? value : "—"}
      </div>
      {subtitle && (
        <div className={styles['summary-card-subtitle']}>{subtitle}</div>
      )}
    </div>
  );
}
