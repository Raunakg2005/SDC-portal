import React from 'react';

const ChatWidget = () => {
  return (
    <div className="chat-widget">
      <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/69cb7672aa01f9d53682fab4d12b595f563ceb67" alt="Chat Icon" className="chat-icon" />
      <p className="chat-text">Need help? Chat with us!</p>
      <style jsx>{`
        .chat-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .chat-icon {
          width: 64px;
          height: 60px;
          cursor: pointer;
        }
        .chat-text {
          font-size: 18px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;