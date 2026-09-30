import React from "react";
import arrowRight from "./vendor/lucide/arrow-right.js";
import calendarDays from "./vendor/lucide/calendar-days.js";
import handshake from "./vendor/lucide/handshake.js";
import heartHandshake from "./vendor/lucide/heart-handshake.js";
import menu from "./vendor/lucide/menu.js";
import usersRound from "./vendor/lucide/users-round.js";
import x from "./vendor/lucide/x.js";

function icon(nodes) {
  return function Icon({ size = 24, className = "" }) {
    return React.createElement(
      "svg",
      { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true },
      nodes.map(([tag, attributes], index) => React.createElement(tag, { ...attributes, key: index })),
    );
  };
}

export const ArrowRight = icon(arrowRight);
export const CalendarDays = icon(calendarDays);
export const Handshake = icon(handshake);
export const HeartHandshake = icon(heartHandshake);
export const Menu = icon(menu);
export const UsersRound = icon(usersRound);
export const X = icon(x);
