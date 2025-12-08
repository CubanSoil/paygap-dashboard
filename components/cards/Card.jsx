import styles from './Card.module.css';

export default function Card({ title, value }) {    
  return (
    <div className={styles.card}>
      <h4 className={styles['card-title']}>{title}</h4>
      <p className={styles['card-value']}>{value}%</p>
    </div>
  );
}
