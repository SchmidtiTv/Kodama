import { createContext, useContext } from "react";
import { translate } from "@/shared/i18n/i18n.js";

export const LangContext = createContext("de");

export const useLang = () => {
  const lang = useContext(LangContext);
  return (key, vars = {}) => translate(lang, key, vars);
};
