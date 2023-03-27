import { ValidatorFn } from "./models/ValidatorFn";

export const validateEmail: ValidatorFn = (email: string): boolean => {
    //RFC 5322
    const re = /regex/;
  
    return re.test(email.trim());
  };
