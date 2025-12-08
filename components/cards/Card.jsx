import styles from './Card.module.css';

export default function Card({ title, value, delay }) {    
  return (
    <div className={styles.card} style={{ '--d': delay }}>
      <h4 className={styles['card-title']}>{title}</h4>
      <p className={styles['card-value']}>{value}%</p>
    </div>
  );
}
