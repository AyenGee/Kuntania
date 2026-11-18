import type { FocusEvent } from "react";

type PhoneEvent = FocusEvent<HTMLInputElement | HTMLTextAreaElement>;

/**
 * Makes a South African phone field start with "+27 " when the customer clicks into it, so they
 * only type the rest. If they leave it with nothing but the prefix, the field is emptied again
 * (an optional phone field must not submit a bare "+27"). Typing a 0 or a full number still works:
 * the server accepts +27, 27 and 0 forms.
 */
export const saPhoneHandlers = {
  onFocus(e: PhoneEvent) {
    if (e.currentTarget.value.trim() === "") e.currentTarget.value = "+27 ";
  },
  onBlur(e: PhoneEvent) {
    if (e.currentTarget.value.replace(/[\s+]/g, "") === "27") e.currentTarget.value = "";
  },
};
