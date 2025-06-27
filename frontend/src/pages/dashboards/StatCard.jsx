import styles from "../../styles/components/HomeScreens.module.css";

const StatCard = ({
  title,
  count,
  icon,
  color,
  details = [],
  customStyle = {},
}) => {
  return (
    <div className={styles.homeStatCard} style={{ borderLeftColor: color }}>
      <div className={styles.statHeader}>
        <div className={styles.statIcon} style={{ color }}>
          {icon}
        </div>
        <h3 className={styles.statTitle}>{title}</h3>
      </div>

      <div className={styles.statCount}>{count}</div>

      {details.length > 0 && (
        <div className={styles.statDetailsGrid} style={customStyle}>
          {details.map((detail, i) => (
            <div
              key={i}
              className={styles.statDetailItem}
              style={{ backgroundColor: `${detail.color}15` }}
            >
              <span
                className={styles.detailValue}
                style={{ color: detail.color }}
              >
                {detail.value}
              </span>
              <span
                className={styles.detailLabel}
                style={{ color: detail.color }}
              >
                {detail.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatCard;
