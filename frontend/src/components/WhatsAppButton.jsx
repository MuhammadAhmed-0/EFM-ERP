import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppButton = ({ challan, onSuccess, onError }) => {
  const formatPhoneNumber = (phone) => {
    if (!phone) return "";

    let cleaned = phone.replace(/\D/g, "");
    if (!cleaned.startsWith("92") && cleaned.length === 10) {
      cleaned = "92" + cleaned;
    }

    return cleaned;
  };

  const formatMonths = (months) => {
    if (!Array.isArray(months) || months.length === 0) {
      return "Not Available";
    }

    const shortMonths = {
      January: "Jan",
      February: "Feb",
      March: "Mar",
      April: "Apr",
      May: "May",
      June: "Jun",
      July: "Jul",
      August: "Aug",
      September: "Sep",
      October: "Oct",
      November: "Nov",
      December: "Dec",
    };

    if (months.length === 1) {
      return shortMonths[months[0]] || months[0];
    } else {
      const MONTHS = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const sortedMonths = [...months].sort(
        (a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b)
      );

      const firstMonth = shortMonths[sortedMonths[0]];
      const lastMonth = shortMonths[sortedMonths[sortedMonths.length - 1]];
      return `${firstMonth} to ${lastMonth}`;
    }
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      USD: "$",
      PKR: "Rs.",
      EUR: "€",
      GBP: "£",
      AUD: "A$",
      CAD: "C$",
      JPY: "¥",
      INR: "₹",
      AED: "د.إ",
      SAR: "ر.س",
      QAR: "ر.ق",
      OMR: "ر.ع.",
      KWD: "د.ك",
      BHD: ".د.ب",
      HKD: "HK$",
      NZD: "NZ$",
      TRY: "₺",
      EGP: "ج.م",
      FJD: "FJ$",
    };
    return symbols[currency] || currency;
  };

  const handleSendWhatsApp = () => {
    try {
      const phoneNumber = formatPhoneNumber(challan.clientPhoneNumber);

      if (!phoneNumber) {
        onError && onError("Phone number not available for this client");
        return;
      }

      const currencySymbol = getCurrencySymbol(challan.clientCurrency);
      const monthText = formatMonths(challan.months);

      const message = `*Dear Clients please have a look on following Fee Invoice*

*Fee Invoice for Client*

*Family name*:              ${challan.clientName}

*Monthly Fee*:               ${currencySymbol}${
        challan.basicFee || challan.amount
      }

*Total students now*:        ${challan.totalStudents || "01"}

*Month*:                     ${challan.dueMonth || monthText}

*${monthText} Fee is* :             ${currencySymbol}${challan.amount}
______________________

*Total Fee*:                ${currencySymbol}${challan.amount}`;

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;

      window.open(whatsappUrl, "_blank");

      onSuccess && onSuccess("WhatsApp opened successfully!");
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      onError && onError("Failed to open WhatsApp");
    }
  };

  const hasPhoneNumber =
    challan.clientPhoneNumber && challan.clientPhoneNumber !== "N/A";

  return (
    <button
      onClick={handleSendWhatsApp}
      disabled={!hasPhoneNumber}
      title={
        !hasPhoneNumber
          ? "Phone number not available"
          : "Send invoice via WhatsApp"
      }
    >
      <FaWhatsapp color="#64748b" size={18} />
    </button>
  );
};

export default WhatsAppButton;
