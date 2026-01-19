import React, { useState } from 'react';

function ImportTeachers() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.match(/\.(xlsx|xls)$/)) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select an Excel file (.xlsx or .xls)');
        setFile(null);
      }
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setResult(null);
    setError('');

    // Simulate API upload
    setTimeout(() => {
      setUploading(false);
      setResult({
        message: 'Import completed successfully',
        teachers_created: 8,
        teachers_updated: 2,
        assignments_created: 12,
        errors: [],
      });
      setFile(null);
      document.getElementById('file-input').value = '';
    }, 2000);
  };

  return (
    <div style={styles.container}>
      <h2>Import Teachers from Excel</h2>
      
      <div style={styles.uploadBox}>
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={styles.fileInput}
        />
        <div style={styles.fileInfo}>
          {file ? (
            <div>
              <p><strong>Selected file:</strong> {file.name}</p>
              <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <p>No file selected</p>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        style={{
          ...styles.uploadButton,
          backgroundColor: uploading || !file ? '#95a5a6' : '#27ae60',
        }}
      >
        {uploading ? 'Uploading...' : '📥 Upload & Import'}
      </button>

      <div style={styles.instructions}>
        <h4>Instructions:</h4>
        <ul>
          <li>Upload an Excel file with Sheet3 containing teacher assignments</li>
          <li>Sheet3 should have columns: Course code, Title, Credits, Course Teacher</li>
          <li>Teacher names should be in column D</li>
          <li>Department information in subsequent rows</li>
        </ul>
      </div>

      {result && (
        <div style={styles.resultBox}>
          <h3>Import Results:</h3>
          <div style={styles.resultGrid}>
            <div style={styles.resultItem}>
              <div style={styles.resultLabel}>Status</div>
              <div style={styles.resultValue}>{result.message}</div>
            </div>
            <div style={styles.resultItem}>
              <div style={styles.resultLabel}>Teachers Created</div>
              <div style={{...styles.resultValue, color: '#27ae60'}}>
                {result.teachers_created}
              </div>
            </div>
            <div style={styles.resultItem}>
              <div style={styles.resultLabel}>Teachers Updated</div>
              <div style={{...styles.resultValue, color: '#3498db'}}>
                {result.teachers_updated}
              </div>
            </div>
            <div style={styles.resultItem}>
              <div style={styles.resultLabel}>Assignments Created</div>
              <div style={{...styles.resultValue, color: '#9b59b6'}}>
                {result.assignments_created}
              </div>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div style={styles.errorsBox}>
              <h4>Errors:</h4>
              <ul>
                {result.errors.map((error, index) => (
                  <li key={index} style={styles.errorItem}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  uploadBox: {
    border: '2px dashed #ddd',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    margin: '1.5rem 0',
    backgroundColor: '#f8f9fa',
  },
  fileInput: {
    display: 'block',
    margin: '0 auto 1rem',
  },
  fileInfo: {
    marginTop: '1rem',
    color: '#6c757d',
  },
  uploadButton: {
    padding: '0.75rem 2rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  instructions: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '0.9rem',
    color: '#6c757d',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '0.75rem',
    borderRadius: '4px',
    margin: '1rem 0',
  },
  resultBox: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginTop: '1rem',
  },
  resultItem: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '4px',
    textAlign: 'center',
  },
  resultLabel: {
    fontSize: '0.9rem',
    color: '#6c757d',
    marginBottom: '0.5rem',
  },
  resultValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  errorsBox: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#fff3cd',
    borderRadius: '4px',
    border: '1px solid #ffeaa7',
  },
  errorItem: {
    color: '#856404',
    padding: '0.25rem 0',
  },
};

export default ImportTeachers;