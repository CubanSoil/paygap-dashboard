"use client";
import styles from './Sidebar.module.css';

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles['sidebar-title']}>Reporjs</div>
      <ul>
        <li className={styles['sidebar-item']}>Pay Gap</li>
      </ul>
    </aside>
  );
}
