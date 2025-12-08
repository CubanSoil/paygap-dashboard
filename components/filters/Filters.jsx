"use client";

import React, { useState } from "react";
import styles from "./Filters.module.css";

export default function Filters({ onApply }) {
  const [employer, setEmployer] = useState("");
  const [postcode, setPostcode] = useState("");
  const [size, setSize] = useState("");
  const [year, setYear] = useState("2025");

  const apply = (e) => {
    e.preventDefault()
    onApply({ employer, postcode, size, year });
  }

  return (
    <form onSubmit={apply} className={styles["filters-container"]}>
      <input
        value={employer}
        onChange={(e) => setEmployer(e.target.value)}
        placeholder="Employer"
        className={styles.input}
      />

      <input
        value={postcode}
        onChange={(e) => setPostcode(e.target.value)}
        placeholder="Postcode"
        className={styles["input-short"]}
      />

      <select
        value={size}
        onChange={(e) => setSize(e.target.value)}
        className={styles["input-short"]}
      >
        <option value="">Any size</option>
        <option>0 to 249</option>
        <option>250 to 499</option>
        <option>500 to 999</option>
        <option>1000 to 4999</option>
        <option>5000 to 19999</option>
      </select>

       <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className={styles["input-short"]}
      >
        <option value="">Select Year</option>
        <option>2025</option>
        <option>2024</option>
        <option>2023</option>
        <option>2022</option>
        <option>2021</option>
        <option>2020</option>
      </select>

      <button type="submit" className={styles["apply-button"]}>
        Apply
      </button>
    </form>
  );
}
