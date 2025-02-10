import React from "react";
import styles from "./Sidebar.module.css";


function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        {/* Удален заголовок CRM Task Manager */}
        <p className={styles.subheader}>Панель управления</p>
        <p className={styles.subheader}>Добро пожаловать</p>
      </div>

      <div className={styles.menuSection}>
        <div className={styles.divider} />
        <span className={styles.sectionTitle}>Скрыты</span>
        <button className={`${styles.menuItem} ${styles.active}`}>Задачи</button>
      </div>

      <div className={styles.menuSection}>
        <div className={styles.divider} />
        <button className={styles.menuItem}>📖 Дневник</button>
        <button className={styles.menuItem}>Cкрипты</button>
        <button className={styles.menuItem}>Идеи</button>
        <button className={styles.menuItem}>⚙️ Настройки</button>
      </div>
    </aside>
  );
}

export default Sidebar;

