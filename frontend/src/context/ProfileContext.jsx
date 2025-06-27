import { createContext, useState, useContext, useEffect } from "react";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => {
    const savedUser = JSON.parse(localStorage.getItem("user")) || {};
    return {
      profilePicture: savedUser.profilePicture || "",
      name: savedUser.name || "",
      role: savedUser.role || "",
      email: savedUser.email || "",
    };
  });

  const updateUserData = (newData) => {
    setUserData((prevData) => {
      const updatedData = { ...prevData, ...newData };
      localStorage.setItem("user", JSON.stringify(updatedData));
      return updatedData;
    });
  };

  const updateProfilePicture = (newPicture) => {
    updateUserData({ profilePicture: newPicture || "" });
  };

  const clearUserData = () => {
    setUserData({
      profilePicture: "",
      name: "",
      role: "",
      email: "",
    });
    localStorage.removeItem("user");
  };

  const getInitials = () => {
    if (!userData.name) return "?";
    return userData.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        const savedUser = JSON.parse(e.newValue) || {};
        setUserData((prevData) => ({
          ...prevData,
          ...savedUser,
        }));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        ...userData,
        updateUserData,
        updateProfilePicture,
        clearUserData,
        getInitials,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export default ProfileContext;
