import {  z } from "zod";
import {parsePhoneNumberFromString } from "libphonenumber-js"; 
export const UserSchema = z.object({
  phoneNumber: z.string().optional().refine(val => {
    if(!val) return true;
    const phoneNumber = parsePhoneNumberFromString(val);
    return phoneNumber?.isValid() || false;
  },{message:"Numéro de téléphone invalide"}),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
});
export type UserInfoType = z.infer<typeof UserSchema>;