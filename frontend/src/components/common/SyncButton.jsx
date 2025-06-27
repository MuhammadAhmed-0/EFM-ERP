import { FaSync } from "react-icons/fa";
import styles from "../../styles/components/SyncButton.module.css";

const SyncButton = ({ isSyncing, onClick }) => (
  <button
    className={`${styles.syncBtn} ${isSyncing ? styles.syncing : ""}`}
    onClick={onClick}
    disabled={isSyncing}
  >
    <FaSync className={isSyncing ? styles.rotate : ""} />
  </button>
);

export default SyncButton;
