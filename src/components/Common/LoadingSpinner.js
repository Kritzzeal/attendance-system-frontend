import React from 'react';

function LoadingSpinner({ size = 'medium', color = '#3498db' }) {
  const sizes = {
    small: '20px',
    medium: '40px',
    large: '60px',
  };

  const spinnerSize = sizes[size] || sizes.medium;

  return (
    <div style={styles.container}>
      <div 
        style={{
          ...styles.spinner,
          width: spinnerSize,
          height: spinnerSize,
          borderColor: `${color} transparent ${color} transparent`,
        }}
      />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
  },
  spinner: {
    borderStyle: 'solid',
    borderWidth: '4px',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// Add CSS animation
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default LoadingSpinner;
