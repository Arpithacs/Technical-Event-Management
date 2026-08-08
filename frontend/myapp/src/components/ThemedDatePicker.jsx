import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./ThemedDatePicker.css";

export default function ThemedDatePicker({ value, onChange, showTimeSelect = false, showTimeSelectOnly = false, placeholderText, ...props }) {
  return (
    <DatePicker
      selected={value ? new Date(value) : null}
      onChange={onChange}
      showTimeSelect={showTimeSelect}
      showTimeSelectOnly={showTimeSelectOnly}
      timeIntervals={15}
      dateFormat={showTimeSelectOnly ? "h:mm aa" : showTimeSelect ? "dd/MM/yyyy h:mm aa" : "dd/MM/yyyy"}
      placeholderText={placeholderText}
      className="themed-date-picker"
      {...props}
    />
  );
}
