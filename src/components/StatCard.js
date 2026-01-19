function StatCard({ title, value, color, icon, loading }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div>
        <h3 style={styles.statTitle}>{title}</h3>
        {loading ? (
          <div style={styles.loadingBar}></div>
        ) : (
          <p style={{ ...styles.statValue, color }}>{value}</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  statCard: {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statIcon: { fontSize: '2rem', marginRight: '1rem' },
  statTitle: { fontSize: '0.9rem', color: '#6c757d' },
  statValue: { fontSize: '1.5rem', fontWeight: 'bold' },
  loadingBar: {
    height: '24px',
    width: '80px',
    background: '#eee',
    borderRadius: '4px',
  },
};

export default StatCard;
