const baseModalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  borderRadius: "12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
  "&:focus-visible": {
    outline: "none",
  },
  fontFamily:
    "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const muiComponentStyles = {
  "& .MuiTypography-root, & .MuiButton-root, & .MuiInputLabel-root, & .MuiOutlinedInput-input, & .MuiSelect-select, & .MuiMenuItem-root":
    {
      fontFamily:
        "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
  "& .MuiTextField-root": {
    "& .MuiOutlinedInput-root": {
      fontFamily:
        "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      "&:hover fieldset": {
        borderColor: "#3949ab",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#3949ab",
      },
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#3949ab",
    },
  },
  "& .MuiFormControl-root": {
    "& .MuiOutlinedInput-root": {
      fontFamily:
        "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      "&:hover fieldset": {
        borderColor: "#3949ab",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#3949ab",
      },
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#3949ab",
    },
  },
};

export const getModalStyles = (customStyles = {}) => ({
  ...baseModalStyle,
  ...muiComponentStyles,
  ...customStyles,
});
