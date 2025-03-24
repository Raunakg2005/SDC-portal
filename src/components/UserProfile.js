import React, { useEffect, useState } from "react";

const UserProfile = () => {
  const [user, setUser] = useState({ svvNetId: "Guest", role: "Not Logged In" });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user")) || {};
    if (storedUser.svvNetId) {
      setUser(storedUser);
    }
  }, []);

  return (
    <div className="user-profile">
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/57eca2fe7222750eaf370d385ac59968772b541f"
        alt="User Icon"
        className="user-icon"
      />
      <div className="user-info">
        <div className="user-name">{user.svvNetId || "Guest"}</div>
        <div className="user-role">{user.role || "Not Logged In"}</div>
      </div>
      <style jsx>{`
        .user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 5px;
          background-color: #d9d9d9;
        }
        .user-icon {
          width: 27px;
          height: 27px;
        }
        .user-info {
          font-size: 12px;
        }
        .user-name {
          font-weight: 400;
        }
        .user-role {
          font-weight: 500;
        }
        @media (max-width: 640px) {
          .user-profile {
            max-width: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default UserProfile;
