import React from "react";
import styles from "./Header.module.css";
import img from "../images/Depth7.png"

function Header() {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>CRM Task Manager</h1>

      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>🔍</span>
        <input 
          type="text" 
          placeholder="Search"
          className={styles.searchInput}
        />
      </div>
      
      <div className={styles.actions}>
        <button className={styles.createTask}>
          <span>+</span>
          <span>Создать задачу</span>
        </button>
        <button className={styles.bellIcon}><svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="40" height="40" rx="20" fill="#F5F0E6"/>
<g clip-path="url(#clip0_2502_27)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M27.3281 23.7453C26.8945 22.9984 26.25 20.8852 26.25 18.125C26.25 14.6732 23.4518 11.875 20 11.875C16.5482 11.875 13.75 14.6732 13.75 18.125C13.75 20.8859 13.1047 22.9984 12.6711 23.7453C12.4457 24.1318 12.4441 24.6092 12.6668 24.9973C12.8895 25.3853 13.3026 25.6247 13.75 25.625H16.9383C17.2356 27.0796 18.5153 28.1243 20 28.1243C21.4847 28.1243 22.7644 27.0796 23.0617 25.625H26.25C26.6972 25.6244 27.1101 25.3849 27.3326 24.9969C27.5551 24.609 27.5534 24.1317 27.3281 23.7453ZM20 26.875C19.2056 26.8748 18.4976 26.3739 18.2328 25.625H21.7672C21.5024 26.3739 20.7944 26.8748 20 26.875ZM13.75 24.375C14.3516 23.3406 15 20.9438 15 18.125C15 15.3636 17.2386 13.125 20 13.125C22.7614 13.125 25 15.3636 25 18.125C25 20.9414 25.6469 23.3383 26.25 24.375H13.75Z" fill="#1C170D"/>
</g>
<defs>
<clipPath id="clip0_2502_27">
<rect width="20" height="20" fill="white" transform="translate(10 10)"/>
</clipPath>
</defs>
</svg>

        </button>
        <img 
          src= "../images/Depth7.png"
          alt="User" 
          className={styles.avatar}
          width="40" height="40"
        />
      </div>
    </header>
  );
}


export default Header;