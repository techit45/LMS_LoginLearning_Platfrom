import React from 'react';

const TestModal = ({ isOpen, onClose, entry }) => {
  if (!isOpen) {
    return null;
  }
  
  return (
    <>
      {/* Background overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={onClose}
      >
        {/* Modal content */}
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            zIndex: 1000000,
            border: '3px solid red', // สีแดงเพื่อเห็นชัดๆ
            boxShadow: '0 0 50px rgba(255, 0, 0, 0.5)'
          }}
          onClick={e => e.stopPropagation()}
        >
          <h1 style={{ color: 'red', fontSize: '24px', marginBottom: '20px' }}>
            🎉 MODAL ทำงานแล้ว! 🎉
          </h1>
          
          {entry ? (
            <div>
              <p><strong>Entry ID:</strong> {entry.id}</p>
              <p><strong>วันที่:</strong> {entry.entry_date}</p>
              <p><strong>เช็คอิน:</strong> {entry.check_in_time}</p>
              <p><strong>User ID:</strong> {entry.user_id}</p>
            </div>
          ) : (
            <p>ไม่มีข้อมูล entry</p>
          )}
          
          <button 
            onClick={onClose}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ปิด Modal
          </button>
        </div>
      </div>
    </>
  );
};

export default TestModal;