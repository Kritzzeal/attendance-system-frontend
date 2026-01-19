import StatCard from './StatCard';

function StatsGrid({ data, loading }) {
  const cards = [
    { title: 'Total Teachers', value: data.teachers, color: '#3498db', icon: '👨‍🏫' },
    { title: 'Total Courses', value: data.courses, color: '#27ae60', icon: '📚' },
    { title: 'Total Students', value: data.students, color: '#9b59b6', icon: '👥' },
    { title: "Today's Attendance", value: data.attendanceToday, color: '#e74c3c', icon: '✅' },
  ];

  return (
    <div style={gridStyle}>
      {cards.map((card, i) => (
        <StatCard key={i} {...card} loading={loading} />
      ))}
    </div>
  );
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1.5rem',
};

export default StatsGrid;
