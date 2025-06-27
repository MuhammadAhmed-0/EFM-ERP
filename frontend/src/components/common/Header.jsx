import "../../styles/components/Header.css";

const Header = ({ userLogin = "MuhammadAhmed-0" }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="user-info">
          <span className="user-label">Current User: </span>
          <span className="user-value">{userLogin}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
