import React from "react";
import Header from "../common/Header";
import styles from "../../styles/components/AuthLayout.module.css";

const AuthLayout = ({ children }) => {
  return (
    <div className={styles.authLayout}>
      <Header />
      <div className={styles.authContent}>{children}</div>
    </div>
  );
};

export default AuthLayout;
